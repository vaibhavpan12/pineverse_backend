import admin from "../utils/firebase.js";
import FcmToken from "../models/FcmTokenModel.js";
import PushNotification from "../models/PushNotificationModel.js";

const INVALID_TOKEN_ERRORS = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

const toUniqueStrings = (values = []) => {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
};

/** FCM multicast limit per request */
const FCM_MULTICAST_MAX = 500;

const buildDataPayload = (data = {}) =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]));

const createNotificationRecords = async ({
  receiverIds = [],
  senderId = null,
  eventType = "generic",
  title,
  body,
  data = {},
  payload = {},
  pushResultMap = {},
}) => {
  if (!receiverIds.length) return;

  const docs = receiverIds.map((receiverId) => {
    const result = pushResultMap[String(receiverId)] || {};
    return {
      receiverId: String(receiverId),
      senderId: senderId ? String(senderId) : null,
      eventType: String(eventType),
      title: String(title || ""),
      body: String(body || ""),
      data,
      payload,
      pushSent: Boolean(result.pushSent),
      pushError: result.pushError || "",
    };
  });

  await PushNotification.insertMany(docs);
};

const cleanupInvalidTokens = async (invalidTokens = []) => {
  if (!invalidTokens.length) return;
  try {
    await FcmToken.deleteMany({ fcmToken: { $in: invalidTokens } });
  } catch (error) {
    console.error("❌ Failed to cleanup invalid FCM tokens:", error.message);
  }
};

const sendToTokens = async ({ tokenDocs, title, body, data = {} }) => {
  const uniqueDocs = [];
  const seen = new Set();

  for (const doc of tokenDocs) {
    const token = doc?.fcmToken?.trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    uniqueDocs.push(doc);
  }

  if (!uniqueDocs.length) {
    return { successCount: 0, failureCount: 0, sentToUsers: [], pushResultMap: {} };
  }

  const multicastBase = {
    notification: { title, body },
    data: buildDataPayload(data),
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "default",
      },
    },
    apns: { payload: { aps: { sound: "default" } } },
  };

  const invalidTokens = [];
  const pushResultMap = {};
  let successCount = 0;
  let failureCount = 0;

  for (let offset = 0; offset < uniqueDocs.length; offset += FCM_MULTICAST_MAX) {
    const chunk = uniqueDocs.slice(offset, offset + FCM_MULTICAST_MAX);
    const response = await admin.messaging().sendEachForMulticast({
      tokens: chunk.map((doc) => doc.fcmToken),
      ...multicastBase,
    });
    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((result, index) => {
      const userId = String(chunk[index]?.userId || "");
      if (result.success) {
        pushResultMap[userId] = { pushSent: true, pushError: "" };
        return;
      }
      const code = result.error?.code;
      pushResultMap[userId] = {
        pushSent: false,
        pushError: result.error?.message || code || "push_failed",
      };
      if (code === "app/invalid-credential") {
        console.error(
          "❌ Firebase Admin JWT/service account invalid (same check as startup). Generate a new private key in Firebase Console and update utils/serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT_* env vars.",
        );
      } else {
        console.warn("FCM failure", {
          userId,
          code,
          message: result.error?.message,
        });
      }
      if (INVALID_TOKEN_ERRORS.has(code)) {
        invalidTokens.push(chunk[index]?.fcmToken);
      }
    });
  }

  await cleanupInvalidTokens(invalidTokens);

  return {
    successCount,
    failureCount,
    sentToUsers: toUniqueStrings(uniqueDocs.map((doc) => doc.userId)),
    pushResultMap,
  };
};

export const sendNotificationToUsers = async ({
  userIds = [],
  title,
  body,
  data = {},
  excludeUserIds = [],
  senderId = null,
  eventType = "generic",
  payload = {},
}) => {
  try {
    const excludedIds = toUniqueStrings([
      ...excludeUserIds,
      ...(senderId ? [senderId] : []),
    ]);
    const targetUserIds = toUniqueStrings(userIds).filter((id) => !excludedIds.includes(id));

    if (!targetUserIds.length) {
      console.log("ℹ️ Push skipped: no target users after sender/exclude filtering");
      return { successCount: 0, failureCount: 0, sentToUsers: [] };
    }

    const tokenDocs = await FcmToken.find({ userId: { $in: targetUserIds } })
      .select("userId fcmToken")
      .lean();

    if (!tokenDocs.length) {
      console.warn("⚠️ Push skipped: no FCM tokens found for target users", {
        eventType,
        senderId,
        targetUserIds,
      });
    }

    const pushResult = await sendToTokens({ tokenDocs, title, body, data });
    console.log("✅ Push attempt (targeted users)", {
      eventType,
      senderId,
      targetUsers: targetUserIds.length,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
    });

    await createNotificationRecords({
      receiverIds: targetUserIds,
      senderId,
      eventType,
      title,
      body,
      data,
      payload,
      pushResultMap: pushResult.pushResultMap || {},
    });
    return pushResult;
  } catch (error) {
    console.error("❌ sendNotificationToUsers error:", error.message);
    return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
  }
};

export const sendNotificationToAllExcept = async ({
  excludeUserIds = [],
  title,
  body,
  data = {},
  senderId = null,
  eventType = "generic",
  payload = {},
}) => {
  try {
    const excluded = toUniqueStrings([
      ...excludeUserIds,
      ...(senderId ? [senderId] : []),
    ]);
    const tokenDocs = await FcmToken.find({
      userId: excluded.length ? { $nin: excluded } : { $exists: true },
    })
      .select("userId fcmToken")
      .lean();

    const targetUserIds = toUniqueStrings(tokenDocs.map((doc) => doc.userId));
    const pushResult = await sendToTokens({ tokenDocs, title, body, data });
    console.log("✅ Push attempt (broadcast)", {
      eventType,
      senderId,
      targetUsers: targetUserIds.length,
      successCount: pushResult.successCount,
      failureCount: pushResult.failureCount,
    });

    await createNotificationRecords({
      receiverIds: targetUserIds,
      senderId,
      eventType,
      title,
      body,
      data,
      payload,
      pushResultMap: pushResult.pushResultMap || {},
    });

    return pushResult;
  } catch (error) {
    console.error("❌ sendNotificationToAllExcept error:", error.message);
    return { successCount: 0, failureCount: 0, sentToUsers: [], error: error.message };
  }
};


// new file