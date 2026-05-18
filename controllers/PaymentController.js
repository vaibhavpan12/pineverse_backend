// import Payment from "../models/PaymentModel.js";

// // ✅ Create Payment (jab payment initiate ho)
// export const createPayment = async (req, res) => {
//     try {
//         const { user_id, SubSriptionMonths, transactionId, amount, status } = req.body;

//         if (!user_id || !SubSriptionMonths || !transactionId || !amount) {
//             return res.status(400).json({
//                 success: false,
//                 message: "user_id, SubSriptionMonths, transactionId, amount are required",
//             });
//         }
        
//         // duplicate transaction check
//         const existing = await Payment.findOne({ transactionId });
//         if (existing) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Transaction already exists",
//             });
//         }

//         const payment = await Payment.create({
//             user_id,
//             SubSriptionMonths,
//             transactionId,
//             amount,
//             status: status || "pending", // ✅ yahan fix hai
//         });

//         res.status(201).json({
//             success: true,
//             message: "Payment created successfully",
//             data: payment,
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };


// // ✅ Update Payment Status (Razorpay webhook ya success ke baad)
// export const updatePaymentStatus = async (req, res) => {
//     try {
//         const { transactionId, status } = req.body;

//         const payment = await Payment.findOneAndUpdate(
//             { transactionId },
//             { status },
//             { new: true }
//         );

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Payment status updated",
//             data: payment,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



// // ✅ Get User Payments
// export const getUserPayments = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         const payments = await Payment.find({ user_id }).sort({ createdAt: -1 });

//         res.status(200).json({
//             success: true,
//             data: payments,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



// // ✅ Get Single Payment
// export const getSinglePayment = async (req, res) => {
//     try {
//         const { transactionId } = req.params;

//         const payment = await Payment.findOne({ transactionId });

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: payment,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



// // ✅ Delete Payment (optional admin use)
// export const deletePayment = async (req, res) => {
//     try {
//         const { id } = req.params;

//         await Payment.findByIdAndDelete(id);

//         res.status(200).json({
//             success: true,
//             message: "Payment deleted",
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



// import Payment from "../models/PaymentModel.js";
// import mongoose from "mongoose";

// // Helper function to calculate expiry date
// const calculateExpiryDate = (subscriptionMonths) => {
//     if (subscriptionMonths === 0) {
//         return null; // 0 months - no expiry
//     }

//     const expiryDate = new Date();
//     expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);
//     return expiryDate;
// };

// // ✅ Create Payment (jab payment initiate ho)
// export const createPayment = async (req, res) => {
//     try {
//         const { user_id, SubSriptionMonths, transactionId, amount, status, planType } = req.body;

//         // Validate required fields
//         if (!user_id || SubSriptionMonths === undefined || !transactionId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "user_id, SubSriptionMonths, transactionId are required",
//             });
//         }

//         // Validate subscription months
//         if (![0, 3, 6, 12].includes(SubSriptionMonths)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid subscription months. Allowed values: 0, 3, 6, 12",
//             });
//         }

//         // Determine plan type based on subscription months
//         let finalPlanType = planType;
//         if (!finalPlanType) {
//             // Auto-determine plan type if not provided
//             finalPlanType = SubSriptionMonths === 0 ? "free" : "paid";
//         }

//         // ✅ UPDATED: Free plan allowed for 0 months (lifetime) OR 3 months (with expiry)
//         if (finalPlanType === "free" && ![0, 3].includes(SubSriptionMonths)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Free plan can only be used with 0 or 3 months subscription",
//             });
//         }

//         if (finalPlanType === "paid" && SubSriptionMonths === 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Paid plan cannot be used with 0 months subscription",
//             });
//         }

//         // Validate planType enum
//         if (planType && !["free", "paid", "expir"].includes(planType)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "planType must be either 'free' or 'paid'",
//             });
//         }

//         // For paid plans (3,6,12 months), amount is required
//         if (finalPlanType === "paid" && (!amount || amount <= 0)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid amount is required for paid subscriptions",
//             });
//         }

//         // For free plan, amount should be 0
//         if (finalPlanType === "free") {
//             if (amount && amount > 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Free plan should have amount 0",
//                 });
//             }
//         }

//         // Duplicate transaction check
//         const existing = await Payment.findOne({ transactionId });
//         if (existing) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Transaction already exists",
//             });
//         }

//         // Check if user already has an active subscription
//         const existingActivePayment = await Payment.findOne({
//             user_id,
//             status: "success",
//             $or: [
//                 { planType: "free", SubSriptionMonths: 0 }, // lifetime free plan
//                 { expiryDate: { $gt: new Date() } }          // active paid or 3-month free plan
//             ]
//         });

//         let SubSriptionHistory = SubSriptionMonths;

//         // If user has active subscription, add to history
//         if (existingActivePayment) {
//             SubSriptionHistory = existingActivePayment.SubSriptionHistory + SubSriptionMonths;
//         }

//         // Calculate expiry date
//         // ✅ Free plan with 3 months will get expiry via calculateExpiryDate(3)
//         // Free plan with 0 months will still get null (lifetime)
//         const expiryDate = calculateExpiryDate(SubSriptionMonths);

//         const paymentData = {
//             user_id,
//             SubSriptionMonths,
//             SubSriptionHistory,
//             transactionId,
//             amount: finalPlanType === "free" ? 0 : amount,
//             status: status || "pending",
//             expiryDate: expiryDate,
//             planType: finalPlanType,
//         };

//         // Only add activatedAt if payment is already successful
//         if (status === "success") {
//             paymentData.activatedAt = new Date();
//         }

//         const payment = await Payment.create(paymentData);

//         // Prepare response message
//         let successMessage = "Payment created successfully";
//         if (finalPlanType === "free" && SubSriptionMonths === 3) {
//             successMessage = "Free plan activated successfully (expires in 3 months)";
//         } else if (finalPlanType === "free" && SubSriptionMonths === 0) {
//             successMessage = "Free plan activated successfully";
//         }

//         res.status(201).json({
//             success: true,
//             message: successMessage,
//             data: {
//                 ...payment.toObject(),
//                 planType: finalPlanType,
//                 expiryMessage: finalPlanType === "free" && SubSriptionMonths === 0
//                     ? "No expiry for free plan"
//                     : `Subscription will expire on ${expiryDate.toLocaleDateString()}`,
//                 amountPaid: finalPlanType === "free" ? 0 : amount
//             },
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // ✅ Update Payment Status (Razorpay webhook ya success ke baad)
// export const updatePaymentStatus = async (req, res) => {
//     try {
//         const { transactionId, status } = req.body;

//         const payment = await Payment.findOne({ transactionId });

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found",
//             });
//         }

//         let updateData = { status };

//         if (status === "success") {
//             updateData.activatedAt = new Date();

//             // Update expiry date for paid plans
//             if (payment.planType === "paid" && payment.SubSriptionMonths > 0) {
//                 const expiryDate = calculateExpiryDate(payment.SubSriptionMonths);
//                 updateData.expiryDate = expiryDate;
//             }

//             // ✅ Free plan with 3 months gets expiry; 0 months stays null (lifetime)
//             if (payment.planType === "free" && payment.SubSriptionMonths === 3) {
//                 updateData.expiryDate = calculateExpiryDate(3);
//             } else if (payment.planType === "free" && payment.SubSriptionMonths === 0) {
//                 updateData.expiryDate = null;
//             }
//         }

//         const updatedPayment = await Payment.findOneAndUpdate(
//             { transactionId },
//             updateData,
//             { new: true }
//         );

//         res.status(200).json({
//             success: true,
//             message: "Payment status updated",
//             data: updatedPayment,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // ✅ Get User Payments with active status check
// export const getUserPayments = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         const payments = await Payment.find({ user_id }).sort({ createdAt: -1 });

//         // Add active status to each payment
//         const paymentsWithStatus = payments.map(payment => {
//             const paymentObj = payment.toObject();

//             if (paymentObj.status === "success") {
//                 // ✅ Lifetime free plan (0 months)
//                 if (paymentObj.planType === "free" && paymentObj.SubSriptionMonths === 0) {
//                     paymentObj.isActive = true;
//                     paymentObj.daysRemaining = "Lifetime (Free Plan)";
//                 } else if (paymentObj.expiryDate) {
//                     // Paid plan or 3-month free plan — check expiry
//                     paymentObj.isActive = new Date() < new Date(paymentObj.expiryDate);
//                     paymentObj.daysRemaining = paymentObj.isActive
//                         ? Math.ceil((new Date(paymentObj.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
//                         : 0;
//                 } else {
//                     paymentObj.isActive = false;
//                     paymentObj.daysRemaining = 0;
//                 }
//             } else {
//                 paymentObj.isActive = false;
//                 paymentObj.daysRemaining = 0;
//             }

//             return paymentObj;
//         });

//         res.status(200).json({
//             success: true,
//             data: paymentsWithStatus,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // ✅ Get Single Payment with expiry info
// export const getSinglePayment = async (req, res) => {
//     try {
//         const { transactionId } = req.params;

//         const payment = await Payment.findOne({ transactionId });

//         if (!payment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found",
//             });
//         }

//         const paymentObj = payment.toObject();

//         if (paymentObj.status === "success") {
//             // ✅ Lifetime free plan (0 months)
//             if (paymentObj.planType === "free" && paymentObj.SubSriptionMonths === 0) {
//                 paymentObj.isActive = true;
//                 paymentObj.daysRemaining = "Lifetime (Free Plan)";
//                 paymentObj.expiryMessage = "Free plan never expires";
//             } else if (paymentObj.expiryDate) {
//                 // Paid plan or 3-month free plan — check expiry
//                 const now = new Date();
//                 paymentObj.isActive = now < new Date(paymentObj.expiryDate);
//                 paymentObj.daysRemaining = paymentObj.isActive
//                     ? Math.ceil((new Date(paymentObj.expiryDate) - now) / (1000 * 60 * 60 * 24))
//                     : 0;
//                 paymentObj.expiryMessage = paymentObj.isActive
//                     ? `Active for ${paymentObj.daysRemaining} more days`
//                     : "Subscription expired";
//             } else {
//                 paymentObj.isActive = false;
//                 paymentObj.daysRemaining = 0;
//                 paymentObj.expiryMessage = "No expiry date set";
//             }
//         } else {
//             paymentObj.isActive = false;
//             paymentObj.daysRemaining = 0;
//             paymentObj.expiryMessage = `Payment status: ${paymentObj.status}`;
//         }

//         res.status(200).json({
//             success: true,
//             data: paymentObj,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // ✅ Check if user has active subscription
// export const checkActiveSubscription = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         // ✅ Lifetime free (0 months) always active; paid & 3-month free check expiryDate
//         const activePayment = await Payment.findOne({
//             user_id,
//             status: "success",
//             $or: [
//                 { planType: "free", SubSriptionMonths: 0 }, // lifetime free plan
//                 { expiryDate: { $gt: new Date() } }          // paid or 3-month free plan
//             ]
//         }).sort({ createdAt: -1 });

//         if (!activePayment) {
//             return res.status(200).json({
//                 success: true,
//                 hasActiveSubscription: false,
//                 message: "No active subscription found"
//             });
//         }

//         // Lifetime free plan response
//         if (activePayment.planType === "free" && activePayment.SubSriptionMonths === 0) {
//             return res.status(200).json({
//                 success: true,
//                 hasActiveSubscription: true,
//                 planType: "free",
//                 plan: "Free Plan",
//                 message: "User has free plan (no expiry)",
//                 subscriptionDetails: {
//                     transactionId: activePayment.transactionId,
//                     activatedAt: activePayment.activatedAt || activePayment.createdAt,
//                     months: activePayment.SubSriptionMonths
//                 }
//             });
//         }

//         // Paid plan or 3-month free plan
//         const daysRemaining = Math.ceil((new Date(activePayment.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

//         return res.status(200).json({
//             success: true,
//             hasActiveSubscription: true,
//             planType: activePayment.planType,
//             plan: activePayment.planType === "free"
//                 ? "Free Plan (3 months)"
//                 : `${activePayment.SubSriptionMonths} months`,
//             expiryDate: activePayment.expiryDate,
//             daysRemaining,
//             message: `Subscription active for ${daysRemaining} more days`,
//             subscriptionDetails: {
//                 transactionId: activePayment.transactionId,
//                 amount: activePayment.amount,
//                 activatedAt: activePayment.activatedAt,
//                 months: activePayment.SubSriptionMonths
//             }
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };

// // ✅ Get User's total subscription history
// export const getSubscriptionHistory = async (req, res) => {
//     try {
//         const { user_id } = req.params;

//         const payments = await Payment.find({
//             user_id,
//             status: "success"
//         }).sort({ createdAt: -1 });

//         const totalMonths = payments.reduce((sum, payment) => sum + payment.SubSriptionMonths, 0);
//         const totalAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

//         const freePlans = payments.filter(p => p.planType === "free");
//         const paidPlans = payments.filter(p => p.planType === "paid");

//         // Find current active subscription
//         let currentActiveSubscription = null;
//         const activePaidPlan = payments.find(p =>
//             p.planType === "paid" && p.expiryDate && new Date() < new Date(p.expiryDate)
//         );
//         // ✅ Active free plan: 0 months (lifetime) OR 3 months (still within expiry)
//         const activeFreePlan = payments.find(p =>
//             p.planType === "free" && (
//                 p.SubSriptionMonths === 0 ||
//                 (p.expiryDate && new Date() < new Date(p.expiryDate))
//             )
//         );

//         currentActiveSubscription = activePaidPlan || activeFreePlan || null;

//         res.status(200).json({
//             success: true,
//             data: {
//                 summary: {
//                     totalSubscriptions: payments.length,
//                     totalMonthsSubscribed: totalMonths,
//                     totalAmountSpent: totalAmount,
//                     freePlanCount: freePlans.length,
//                     paidPlanCount: paidPlans.length
//                 },
//                 currentActiveSubscription: currentActiveSubscription ? {
//                     planType: currentActiveSubscription.planType,
//                     months: currentActiveSubscription.SubSriptionMonths,
//                     expiryDate: currentActiveSubscription.expiryDate,
//                     activatedAt: currentActiveSubscription.activatedAt,
//                     transactionId: currentActiveSubscription.transactionId
//                 } : null,
//                 history: payments
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };



// // ✅ Delete Payment (optional admin use)
// export const deletePayment = async (req, res) => {
//     try {
//         const { id } = req.params;

//         const deletedPayment = await Payment.findByIdAndDelete(id);

//         if (!deletedPayment) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Payment not found",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Payment deleted successfully",
//             data: {
//                 deletedId: id,
//                 planType: deletedPayment.planType
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// };


import Payment from "../models/PaymentModel.js";
import mongoose from "mongoose";

// ✅ Helper: Calculate expiry date
const calculateExpiryDate = (subscriptionMonths) => {
    if (subscriptionMonths === 0) {
        return null;
    }
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);
    return expiryDate;
};

// ✅ Helper: Determine useSubscriptionStatus
const determineSubscriptionStatus = (status, planType, subMonths, expiryDate) => {
    if (status !== "success" || planType === "expir") return "Inactive";
    if (planType === "free" && subMonths === 0) return "Active"; // Lifetime
    if (expiryDate && new Date() < new Date(expiryDate)) return "Active";
    return "Inactive";
};

// ✅ Helper: Auto-expire free plans that crossed 3 months
const autoExpireFreePlans = async (user_id) => {
    try {
        const now = new Date();
        await Payment.updateMany(
            {
                user_id,
                planType: "free",
                SubSriptionMonths: 3,
                status: "success",
                expiryDate: { $lt: now },
            },
            {
                $set: {
                    planType: "expir",
                    useSubscriptionStatus: "Inactive",
                },
            }
        );
    } catch (err) {
        console.error("autoExpireFreePlans error:", err.message);
    }
};

// ✅ Helper: When user buys a paid plan, expire any active free plan
const expireFreePlanOnPaidUpgrade = async (user_id) => {
    try {
        await Payment.updateMany(
            {
                user_id,
                planType: "free",
                status: "success",
            },
            {
                $set: {
                    planType: "expir",
                    useSubscriptionStatus: "Inactive",
                },
            }
        );
    } catch (err) {
        console.error("expireFreePlanOnPaidUpgrade error:", err.message);
    }
};

// ✅ Create Payment
export const createPayment = async (req, res) => {
    try {
        const { user_id, SubSriptionMonths, transactionId, amount, status, planType } = req.body;

        if (!user_id || SubSriptionMonths === undefined || !transactionId) {
            return res.status(400).json({
                success: false,
                message: "user_id, SubSriptionMonths, transactionId are required",
            });
        }

        if (![0, 3, 6, 12].includes(SubSriptionMonths)) {
            return res.status(400).json({
                success: false,
                message: "Invalid subscription months. Allowed values: 0, 3, 6, 12",
            });
        }

        let finalPlanType = planType;
        if (!finalPlanType) {
            finalPlanType = SubSriptionMonths === 0 ? "free" : "paid";
        }

        if (finalPlanType === "free" && ![0, 3].includes(SubSriptionMonths)) {
            return res.status(400).json({
                success: false,
                message: "Free plan can only be used with 0 or 3 months subscription",
            });
        }

        if (finalPlanType === "paid" && SubSriptionMonths === 0) {
            return res.status(400).json({
                success: false,
                message: "Paid plan cannot be used with 0 months subscription",
            });
        }

        if (planType && !["free", "paid", "expir"].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: "planType must be 'free', 'paid', or 'expir'",
            });
        }

        if (finalPlanType === "paid" && (!amount || amount <= 0)) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required for paid subscriptions",
            });
        }

        if (finalPlanType === "free" && amount && amount > 0) {
            return res.status(400).json({
                success: false,
                message: "Free plan should have amount 0",
            });
        }

        const existing = await Payment.findOne({ transactionId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Transaction already exists",
            });
        }

        if (finalPlanType === "paid" && status === "success") {
            await expireFreePlanOnPaidUpgrade(user_id);
        }

        const existingActivePayment = await Payment.findOne({
            user_id,
            status: "success",
            $or: [
                { planType: "free", SubSriptionMonths: 0 },
                { expiryDate: { $gt: new Date() } },
            ],
        });

        let SubSriptionHistory = SubSriptionMonths;
        if (existingActivePayment) {
            SubSriptionHistory = existingActivePayment.SubSriptionHistory + SubSriptionMonths;
        }

        const expiryDate = calculateExpiryDate(SubSriptionMonths);

        const useSubscriptionStatus = determineSubscriptionStatus(
            status || "pending",
            finalPlanType,
            SubSriptionMonths,
            expiryDate
        );

        const paymentData = {
            user_id,
            SubSriptionMonths,
            SubSriptionHistory,
            transactionId,
            amount: finalPlanType === "free" ? 0 : amount,
            status: status || "pending",
            expiryDate,
            planType: finalPlanType,
            useSubscriptionStatus,
        };

        if (status === "success") {
            paymentData.activatedAt = new Date();
        }

        const payment = await Payment.create(paymentData);

        let successMessage = "Payment created successfully";
        if (finalPlanType === "free" && SubSriptionMonths === 3) {
            successMessage = "Free plan activated successfully (expires in 3 months)";
        } else if (finalPlanType === "free" && SubSriptionMonths === 0) {
            successMessage = "Free plan activated successfully";
        } else if (finalPlanType === "paid") {
            successMessage =
                "Paid plan activated successfully. Previous free plan (if any) has been marked as expired.";
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            data: {
                ...payment.toObject(),
                planType: finalPlanType,
                useSubscriptionStatus,
                expiryMessage:
                    finalPlanType === "free" && SubSriptionMonths === 0
                        ? "No expiry for free plan"
                        : expiryDate
                            ? `Subscription will expire on ${expiryDate.toLocaleDateString()}`
                            : "No expiry set",
                amountPaid: finalPlanType === "free" ? 0 : amount,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Update Payment Status
export const updatePaymentStatus = async (req, res) => {
    try {
        const { transactionId, status } = req.body;

        const payment = await Payment.findOne({ transactionId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        let updateData = { status };

        if (status === "success") {
            updateData.activatedAt = new Date();

            if (payment.planType === "paid") {
                await expireFreePlanOnPaidUpgrade(payment.user_id);
            }

            if (payment.planType === "paid" && payment.SubSriptionMonths > 0) {
                updateData.expiryDate = calculateExpiryDate(payment.SubSriptionMonths);
            }

            if (payment.planType === "free" && payment.SubSriptionMonths === 3) {
                updateData.expiryDate = calculateExpiryDate(3);
            } else if (payment.planType === "free" && payment.SubSriptionMonths === 0) {
                updateData.expiryDate = null;
            }
        }

        updateData.useSubscriptionStatus = determineSubscriptionStatus(
            status,
            payment.planType,
            payment.SubSriptionMonths,
            updateData.expiryDate ?? payment.expiryDate
        );

        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId },
            updateData,
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Payment status updated",
            data: updatedPayment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Get User Payments
export const getUserPayments = async (req, res) => {
    try {
        const { user_id } = req.params;

        await autoExpireFreePlans(user_id);

        const payments = await Payment.find({ user_id }).sort({ createdAt: -1 });

        const paymentsWithStatus = payments.map((payment) => {
            const paymentObj = payment.toObject();

            if (paymentObj.planType === "expir") {
                paymentObj.isActive = false;
                paymentObj.daysRemaining = 0;
                paymentObj.expiryMessage = "Plan expired";
                paymentObj.useSubscriptionStatus = "Inactive";
                return paymentObj;
            }

            if (paymentObj.status === "success") {
                if (paymentObj.planType === "free" && paymentObj.SubSriptionMonths === 0) {
                    paymentObj.isActive = true;
                    paymentObj.daysRemaining = "Lifetime (Free Plan)";
                    paymentObj.expiryMessage = "Free plan never expires";
                    paymentObj.useSubscriptionStatus = "Active";
                } else if (paymentObj.expiryDate) {
                    const now = new Date();
                    paymentObj.isActive = now < new Date(paymentObj.expiryDate);
                    paymentObj.daysRemaining = paymentObj.isActive
                        ? Math.ceil(
                            (new Date(paymentObj.expiryDate) - now) / (1000 * 60 * 60 * 24)
                        )
                        : 0;
                    paymentObj.expiryMessage = paymentObj.isActive
                        ? `Active for ${paymentObj.daysRemaining} more days`
                        : "Subscription expired";
                    paymentObj.useSubscriptionStatus = paymentObj.isActive ? "Active" : "Inactive";
                } else {
                    paymentObj.isActive = false;
                    paymentObj.daysRemaining = 0;
                    paymentObj.expiryMessage = "No expiry date set";
                    paymentObj.useSubscriptionStatus = "Inactive";
                }
            } else {
                paymentObj.isActive = false;
                paymentObj.daysRemaining = 0;
                paymentObj.expiryMessage = `Payment status: ${paymentObj.status}`;
                paymentObj.useSubscriptionStatus = "Inactive";
            }

            return paymentObj;
        });

        res.status(200).json({
            success: true,
            data: paymentsWithStatus,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Get Single Payment
export const getSinglePayment = async (req, res) => {
    try {
        const { transactionId } = req.params;

        const payment = await Payment.findOne({ transactionId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        await autoExpireFreePlans(payment.user_id.toString());

        const refreshedPayment = await Payment.findOne({ transactionId });
        const paymentObj = refreshedPayment.toObject();

        if (paymentObj.planType === "expir") {
            paymentObj.isActive = false;
            paymentObj.daysRemaining = 0;
            paymentObj.useSubscriptionStatus = "Inactive";
            paymentObj.expiryMessage = paymentObj.expiryDate
                ? `Plan expired on ${new Date(paymentObj.expiryDate).toLocaleDateString()}`
                : "Plan expired";

            return res.status(200).json({
                success: true,
                data: paymentObj,
            });
        }

        if (paymentObj.status === "success") {
            if (paymentObj.planType === "free" && paymentObj.SubSriptionMonths === 0) {
                paymentObj.isActive = true;
                paymentObj.daysRemaining = "Lifetime (Free Plan)";
                paymentObj.expiryMessage = "Free plan never expires";
                paymentObj.useSubscriptionStatus = "Active";
            } else if (paymentObj.expiryDate) {
                const now = new Date();
                paymentObj.isActive = now < new Date(paymentObj.expiryDate);
                paymentObj.daysRemaining = paymentObj.isActive
                    ? Math.ceil(
                        (new Date(paymentObj.expiryDate) - now) / (1000 * 60 * 60 * 24)
                    )
                    : 0;
                paymentObj.expiryMessage = paymentObj.isActive
                    ? `Active for ${paymentObj.daysRemaining} more days`
                    : "Subscription expired";
                paymentObj.useSubscriptionStatus = paymentObj.isActive ? "Active" : "Inactive";
            } else {
                paymentObj.isActive = false;
                paymentObj.daysRemaining = 0;
                paymentObj.expiryMessage = "No expiry date set";
                paymentObj.useSubscriptionStatus = "Inactive";
            }
        } else {
            paymentObj.isActive = false;
            paymentObj.daysRemaining = 0;
            paymentObj.expiryMessage = `Payment status: ${paymentObj.status}`;
            paymentObj.useSubscriptionStatus = "Inactive";
        }

        res.status(200).json({
            success: true,
            data: paymentObj,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Check Active Subscription
export const checkActiveSubscription = async (req, res) => {
    try {
        const { user_id } = req.params;

        // ✅ Step 1: Pehle auto-expire karo
        await autoExpireFreePlans(user_id);

        // ✅ Step 2: Active payment dhundo (3-month free bhi include)
        const activePayment = await Payment.findOne({
            user_id,
            status: "success",
            planType: { $ne: "expir" },
            $or: [
                { planType: "free", SubSriptionMonths: 0 },
                { planType: "free", expiryDate: { $gt: new Date() } },
                { planType: "paid", expiryDate: { $gt: new Date() } },
            ],
        }).sort({ createdAt: -1 });

        if (!activePayment) {
            const lastPayment = await Payment.findOne({
                user_id,
                status: "success",
            }).sort({ createdAt: -1 });

            if (lastPayment && lastPayment.planType === "expir") {
                return res.status(200).json({
                    success: true,
                    hasActiveSubscription: false,
                    planType: "expir",
                    useSubscriptionStatus: "Inactive",
                    message: "Your free plan has expired. Please upgrade to a paid plan.",
                    expiredOn: lastPayment.expiryDate,
                });
            }

            return res.status(200).json({
                success: true,
                hasActiveSubscription: false,
                useSubscriptionStatus: "Inactive",
                message: "No active subscription found",
            });
        }

        // ✅ Lifetime free plan
        if (activePayment.planType === "free" && activePayment.SubSriptionMonths === 0) {
            return res.status(200).json({
                success: true,
                hasActiveSubscription: true,
                planType: "free",
                useSubscriptionStatus: "Active",
                plan: "Free Plan (Lifetime)",
                message: "User has free plan (no expiry)",
                subscriptionDetails: {
                    transactionId: activePayment.transactionId,
                    activatedAt: activePayment.activatedAt || activePayment.createdAt,
                    months: activePayment.SubSriptionMonths,
                },
            });
        }

        // ✅ 3-Month Free Plan
        if (activePayment.planType === "free" && activePayment.SubSriptionMonths === 3) {
            const now = new Date();
            const isExpired = now > new Date(activePayment.expiryDate);

            // ✅ Agar expire ho gayi to DB update karo
            if (isExpired) {
                await Payment.findOneAndUpdate(
                    { _id: activePayment._id },
                    {
                        $set: {
                            planType: "expir",
                            useSubscriptionStatus: "Inactive",
                        },
                    }
                );

                return res.status(200).json({
                    success: true,
                    hasActiveSubscription: false,
                    planType: "expir",
                    useSubscriptionStatus: "Inactive",
                    message: "Your free plan has expired. Please upgrade to a paid plan.",
                    expiredOn: activePayment.expiryDate,
                });
            }

            // ✅ Active hai
            const daysRemaining = Math.ceil(
                (new Date(activePayment.expiryDate) - now) / (1000 * 60 * 60 * 24)
            );

            return res.status(200).json({
                success: true,
                hasActiveSubscription: true,
                planType: "free",
                useSubscriptionStatus: "Active",
                plan: "Free Plan (3 Months)",
                expiryDate: activePayment.expiryDate,
                daysRemaining,
                message: `Free subscription active for ${daysRemaining} more days`,
                subscriptionDetails: {
                    transactionId: activePayment.transactionId,
                    amount: 0,
                    activatedAt: activePayment.activatedAt || activePayment.createdAt,
                    months: activePayment.SubSriptionMonths,
                },
            });
        }

        // ✅ Paid plan
        const daysRemaining = Math.ceil(
            (new Date(activePayment.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        );

        return res.status(200).json({
            success: true,
            hasActiveSubscription: true,
            planType: activePayment.planType,
            useSubscriptionStatus: "Active",
            plan: `${activePayment.SubSriptionMonths} months`,
            expiryDate: activePayment.expiryDate,
            daysRemaining,
            message: `Subscription active for ${daysRemaining} more days`,
            subscriptionDetails: {
                transactionId: activePayment.transactionId,
                amount: activePayment.amount,
                activatedAt: activePayment.activatedAt,
                months: activePayment.SubSriptionMonths,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Get Subscription History
export const getSubscriptionHistory = async (req, res) => {
    try {
        const { user_id } = req.params;

        await autoExpireFreePlans(user_id);

        const payments = await Payment.find({
            user_id,
            status: "success",
        }).sort({ createdAt: -1 });

        const totalMonths = payments.reduce((sum, p) => sum + p.SubSriptionMonths, 0);
        const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const freePlans = payments.filter((p) => p.planType === "free");
        const paidPlans = payments.filter((p) => p.planType === "paid");
        const expiredPlans = payments.filter((p) => p.planType === "expir");

        const now = new Date();

        const activePaidPlan = payments.find(
            (p) => p.planType === "paid" && p.expiryDate && now < new Date(p.expiryDate)
        );
        const activeFreePlan = payments.find(
            (p) =>
                p.planType === "free" &&
                (p.SubSriptionMonths === 0 ||
                    (p.expiryDate && now < new Date(p.expiryDate)))
        );

        const currentActiveSubscription = activePaidPlan || activeFreePlan || null;

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalSubscriptions: payments.length,
                    totalMonthsSubscribed: totalMonths,
                    totalAmountSpent: totalAmount,
                    freePlanCount: freePlans.length,
                    paidPlanCount: paidPlans.length,
                    expiredPlanCount: expiredPlans.length,
                },
                currentActiveSubscription: currentActiveSubscription
                    ? {
                        planType: currentActiveSubscription.planType,
                        useSubscriptionStatus: "Active",
                        months: currentActiveSubscription.SubSriptionMonths,
                        expiryDate: currentActiveSubscription.expiryDate,
                        activatedAt: currentActiveSubscription.activatedAt,
                        transactionId: currentActiveSubscription.transactionId,
                    }
                    : null,
                history: payments.map((p) => ({
                    ...p.toObject(),
                    useSubscriptionStatus: p.toObject().useSubscriptionStatus,
                    planLabel:
                        p.planType === "expir"
                            ? "Expired Free Plan"
                            : p.planType === "free" && p.SubSriptionMonths === 0
                                ? "Free Plan (Lifetime)"
                                : p.planType === "free"
                                    ? "Free Plan (3 months)"
                                    : `Paid Plan (${p.SubSriptionMonths} months)`,
                })),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ✅ Delete Payment (Admin only)
export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPayment = await Payment.findByIdAndDelete(id);

        if (!deletedPayment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment deleted successfully",
            data: {
                deletedId: id,
                planType: deletedPayment.planType,
                useSubscriptionStatus: deletedPayment.useSubscriptionStatus,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};