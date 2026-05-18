import admin from "firebase-admin";

function loadServiceAccount() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

const serviceAccount = loadServiceAccount();

if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  throw new Error(
    "❌ Missing Firebase environment variables. Check Render Environment Variables.",
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin Initialized");
}

/** Verify credentials on startup */
export async function verifyFirebaseCredentials() {
  try {
    await admin.app().options.credential.getAccessToken();

    console.log(
      "✅ Firebase Admin credentials OK (push notifications enabled)",
    );
  } catch (e) {
    console.error(
      "❌ Firebase Admin credentials INVALID — push notifications will NOT work.",
    );

    console.error("   ", e.message);
  }
}

export default admin;
