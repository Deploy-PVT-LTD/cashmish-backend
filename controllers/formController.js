import { Form } from "../models/formModel.js";
import { Counter } from "../models/counterModel.js";
import { Mobile } from "../models/mobileModel.js";
import { Category } from "../models/categoryModel.js";
import { User } from "../models/userModel.js";
import { Inventory } from "../models/inventoryModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { PriceConfig } from "../models/priceConfigModel.js";
import { calculatePrice, computeGrade, calculateGradePrice, GRADES } from "../utils/priceCalculator.js";
import { Wallet } from "../models/walletModel.js";
import {
  sendEmail,
  getFormConfirmationTemplate,
  getBidStatusTemplate,
  getAdminBidOfferTemplate,
  getAcceptPriceTemplate
} from "../utils/emailService.js";
import {
  sendSMS,
  getFormConfirmationSMS,
  getAdminBidOfferSMS,
  getAcceptPriceSMS,
  getBidStatusRejectedSMS
} from "../utils/smsService.js";

// Merge global default rules with this product's own overrides, generically across
// whatever question keys exist — works for any category, not just phones.
const buildEffectiveRules = async (mobile) => {
  const globalRules = await PriceConfig.findOne();
  const effectiveRules = globalRules ? JSON.parse(JSON.stringify(globalRules)) : {};

  if (mobile.deductionRules) {
    for (const key of Object.keys(mobile.deductionRules)) {
      effectiveRules[key] = { ...effectiveRules[key], ...mobile.deductionRules[key] };
    }
  }
  return effectiveRules;
};

// Accepts the new generic `conditionAnswers` map (questionKey -> chosen optionKey), or
// — for backward compatibility with older cached frontend bundles — the original
// discrete screen/body/battery fields, folding the latter into the same generic shape.
const resolveConditionAnswers = ({ conditionAnswers, screenCondition, bodyCondition, batteryCondition }) => {
  if (conditionAnswers) {
    return typeof conditionAnswers === 'string' ? JSON.parse(conditionAnswers) : conditionAnswers;
  }
  const answers = {};
  if (screenCondition) answers.screen = screenCondition;
  if (bodyCondition) answers.body = bodyCondition;
  if (batteryCondition) answers.battery = batteryCondition;
  return answers;
};

// Grade-based pricing (current system) with a fallback to the legacy percentage
// system for any product that doesn't have gradePricing configured yet — see
// utils/priceCalculator.js for both.
//
// `forcedGrade` overrides the computed grade entirely — used for the "doesn't turn
// on" gate question (Conditionselection.jsx), which skips every other condition
// question and always prices at a fixed grade.
const resolvePrice = async ({ mobile, storage, carrier, answers, forcedGrade }) => {
  const isLocked = Boolean(carrier && carrier.toLowerCase() !== 'unlocked');

  const category = await Category.findOne({ slug: mobile.category });
  const questions = category ? category.assessmentQuestions : [];

  const validForcedGrade = GRADES.includes(forcedGrade) ? forcedGrade : null;
  const grade = validForcedGrade || computeGrade(answers, questions);

  const gradePrice = calculateGradePrice(mobile, storage, isLocked, grade);
  if (gradePrice !== null) {
    return { estimatedPrice: gradePrice, grade };
  }

  // Fallback: legacy percentage deduction, unchanged behavior for non-migrated
  // products. If a grade was forced (e.g. "doesn't turn on"), synthesize a
  // worst-answer-per-question set so the % system also lands on the worst price
  // instead of accidentally quoting a mint-condition price for a dead phone.
  const effectiveAnswers = validForcedGrade
    ? Object.fromEntries(questions.map((q) => [q.key, q.options?.[q.options.length - 1]?.key]).filter(([, v]) => v))
    : answers;

  const effectiveRules = await buildEffectiveRules(mobile);
  const activeBasePrice = isLocked && mobile.basePriceLocked ? mobile.basePriceLocked : mobile.basePrice;
  const estimatedPrice = calculatePrice(activeBasePrice, { storage, ...effectiveAnswers }, effectiveRules);
  return { estimatedPrice, grade };
};

export const createForm = async (req, res) => {
  try {
    let {
      mobileId,
      storage,
      carrier,
      condition,
      conditionAnswers,
      screenCondition,
      bodyCondition,
      batteryCondition,
      forcedGrade,
      pickUpDetails,
      userId
    } = req.body;

    if (typeof pickUpDetails === "string") {
      pickUpDetails = JSON.parse(pickUpDetails);
    }

    // Validation
    if (!mobileId || !pickUpDetails?.phoneNumber) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    // Upload images to cloudinary
    const imageUrls = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "forms",
              quality: "auto:good",
              fetch_format: "auto",
              width: 1200,
              crop: "limit"
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        imageUrls.push(uploaded.secure_url);
      }
    }

    const answers = resolveConditionAnswers({ conditionAnswers, screenCondition, bodyCondition, batteryCondition });
    const { estimatedPrice, grade } = await resolvePrice({ mobile, storage, carrier, answers, forcedGrade });

    // Prepare form data
    const formData = {
      mobileId,
      storage,
      carrier,
      condition,
      conditionAnswers: answers,
      grade,
      // Legacy mirrors kept for any admin page/export still reading these directly —
      // populated automatically whenever the category's questions use these exact
      // keys (as Mobile Phones does); simply absent for other categories.
      screenCondition: answers.screen,
      bodyCondition: answers.body,
      batteryCondition: answers.battery,
      images: imageUrls,
      estimatedPrice,
      pickUpDetails,
      status: 'pending',
      bidPrice: 0
    };

    // Add userId only if logged-in user
    if (req.user && req.user.id) {
      formData.userId = req.user.id;
      console.log("✅ LOGGED-IN USER - userId:", req.user.id);
    } else if (userId) {
      formData.userId = userId;
      console.log("✅ LOGGED-IN USER - userId from body:", userId);
    } else {
      formData.userId = null;
    }

    const counter = await Counter.findByIdAndUpdate(
      { _id: 'submissionId' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );
    formData.submissionId = counter.seq;

    const form = await Form.create(formData);

    // Populate mobile details before sending response
    await form.populate('mobileId');

    // Send confirmation email (Non-blocking)
    try {
      const html = getFormConfirmationTemplate(
        form.pickUpDetails.fullName,
        `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
        form.estimatedPrice
      );

      sendEmail({
        email: form.pickUpDetails.email,
        subject: 'Form Submission Confirmation - CashMish',
        html,
      }).catch(err => console.error("📧 Non-blocking email error (Confirmation):", err.message));

      // Send confirmation SMS (Non-blocking)
      const smsMessage = getFormConfirmationSMS(
        form.pickUpDetails.fullName,
        `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
        form.estimatedPrice
      );

      sendSMS({
        phone: form.pickUpDetails.phoneNumber,
        message: smsMessage,
      }).catch(err => console.error("📱 Non-blocking SMS error (Confirmation):", err.message));
    } catch (error) {
      // Silent error for email/SMS template generation
    }

    res.status(201).json(form);
  } catch (error) {
    console.error("❌ Form creation error:", error);
    res.status(500).json({ message: "Form creation failed", error: error.message });
  }
};

export const getEstimate = async (req, res) => {
  try {
    const {
      mobileId,
      storage,
      carrier,
      conditionAnswers,
      screenCondition,
      bodyCondition,
      batteryCondition,
      forcedGrade,
    } = req.body;

    if (!mobileId) {
      return res.status(400).json({ message: "Mobile ID is required" });
    }

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    const answers = resolveConditionAnswers({ conditionAnswers, screenCondition, bodyCondition, batteryCondition });
    const { estimatedPrice, grade } = await resolvePrice({ mobile, storage, carrier, answers, forcedGrade });

    res.json({ estimatedPrice, grade });
  } catch (error) {
    console.error("❌ Estimate calculation error:", error);
    res.status(500).json({ message: "Estimate calculation failed", error: error.message });
  }
};


export const getAllForms = async (req, res) => {
  try {
    // Backfill submissionId for old forms that don't have one
    const unassigned = await Form.find({ submissionId: { $exists: false } }).sort({ createdAt: 1 });
    if (unassigned.length > 0) {
      for (const form of unassigned) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'submissionId' },
          { $inc: { seq: 1 } },
          { upsert: true, new: true }
        );
        form.submissionId = counter.seq;
        await form.save();
      }
      console.log(`🔧 Backfilled ${unassigned.length} forms with submissionId`);
    }

    // Also backfill forms where submissionId is null
    const nullIds = await Form.find({ submissionId: null }).sort({ createdAt: 1 });
    if (nullIds.length > 0) {
      for (const form of nullIds) {
        const counter = await Counter.findByIdAndUpdate(
          { _id: 'submissionId' },
          { $inc: { seq: 1 } },
          { upsert: true, new: true }
        );
        form.submissionId = counter.seq;
        await form.save();
      }
      console.log(`🔧 Backfilled ${nullIds.length} null-id forms with submissionId`);
    }

    const forms = await Form.find({})
      .populate("mobileId")
      .populate("userId", "name email phoneNumber")
      .sort({ createdAt: -1 });

    console.log(`📦 Found ${forms.length} total forms`);

    res.json({ forms });
  } catch (error) {
    console.error("❌ Fetch forms error:", error);
    res.status(500).json({ message: "Fetch failed", error: error.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });

    const oldStatus = form.status;
    const oldBidPrice = form.bidPrice;

    // ❌ Block updates if already finalized (accepted, paid, or rejected)
    const finalizedStatuses = ['accepted', 'paid', 'rejected'];
    if (finalizedStatuses.includes(oldStatus)) {
      return res.status(400).json({ message: `Cannot update a ${oldStatus} submission.` });
    }

    // Update status
    if (req.body.status) {
      form.status = req.body.status;
    }

    // Update bidPrice (admin sets this)
    if (req.body.bidPrice !== undefined) {
      form.bidPrice = req.body.bidPrice;
    }

    await form.save();

    // ✅ Sync Wallet if accepted
    if (req.body.status === "accepted" && oldStatus !== "accepted") {
      const amount = parseFloat(form.bidPrice) || 0;
      if (form.userId) {
        await Wallet.findOneAndUpdate(
          { userId: form.userId },
          { $inc: { balance: amount, totalEarnings: amount } },
          { upsert: true, new: true }
        );
      }
    }

    // Populate before sending response
    await form.populate('mobileId');
    await form.populate('userId', 'name email phoneNumber');

    // ✅ Send response FIRST, then email in background (non-blocking)
    res.json(form);

    // Send refined email notifications (fire-and-forget)
    const statusChanged = req.body.status && req.body.status !== oldStatus;
    const bidUpdated = req.body.bidPrice !== undefined && Number(req.body.bidPrice) !== Number(oldBidPrice);

    if (statusChanged || bidUpdated) {
      let html = '';
      let subject = '';
      let smsText = '';

      const deviceName = `${form.mobileId.brand} ${form.mobileId.phoneModel}`;

      if (bidUpdated && (!req.body.status || req.body.status === 'pending' || req.body.status === 'bid_placed')) {
        subject = 'New Bid Offer for Your Device - CashMish';
        html = getAdminBidOfferTemplate(
          form.pickUpDetails.fullName,
          deviceName,
          req.body.bidPrice,
          form._id
        );
        smsText = getAdminBidOfferSMS(form.pickUpDetails.fullName, deviceName, req.body.bidPrice);
      } else if (req.body.status === 'accepted' && statusChanged) {
        subject = 'Trade-in Price Accepted - CashMish';
        html = getAcceptPriceTemplate(
          form.pickUpDetails.fullName,
          deviceName,
          form.bidPrice || form.estimatedPrice
        );
        smsText = getAcceptPriceSMS(form.pickUpDetails.fullName, deviceName, form.bidPrice || form.estimatedPrice);
      } else if (req.body.status === 'rejected' && statusChanged) {
        subject = 'Trade-in Request Status Update - CashMish';
        html = getBidStatusTemplate(
          form.pickUpDetails.fullName,
          deviceName,
          'rejected',
          0
        );
        smsText = getBidStatusRejectedSMS(form.pickUpDetails.fullName, deviceName);
      }

      if (subject && html && form.userId && form.userId.email) {
        sendEmail({
          email: form.userId.email,
          subject,
          html
        }).then(() => {
          console.log(`[DEBUG] Email sent successfully for form update`);
        }).catch(emailErr => {
          console.error(`[DEBUG] Failed to send form update email:`, emailErr.message);
        });
      }

      if (smsText && form.pickUpDetails && form.pickUpDetails.phoneNumber) {
        sendSMS({
          phone: form.pickUpDetails.phoneNumber,
          message: smsText,
        }).then(() => {
          console.log(`[DEBUG] SMS sent successfully for form update`);
        }).catch(smsErr => {
          console.error(`[DEBUG] Failed to send form update SMS:`, smsErr.message);
        });
      }
    }
  } catch (error) {
    console.error("❌ Update form error:", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });

    // Soft delete — just mark as deleted, don't remove from DB
    form.isDeleted = true;
    await form.save();

    console.log("🗑️ Form soft-deleted:", req.params.id);

    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("❌ Delete form error:", error);
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate("mobileId")
      .populate("userId", "name email phoneNumber");

    if (!form) return res.status(404).json({ message: "Form not found" });

    res.json(form);
  } catch (error) {
    console.error("❌ Get form error:", error);
    res.status(500).json({ message: "Fetch failed", error: error.message });
  }
};

// get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalSubmissions = await Form.countDocuments();
    const pendingOrders = await Form.countDocuments({ status: 'pending' });
    const acceptedDeals = await Form.countDocuments({ status: 'accepted' });
    const rejectedDeals = await Form.countDocuments({ status: 'rejected' });
    const totalUsers = await User.countDocuments();

    // 2. Total Purchase (Sum of bidPrice for accepted forms)
    const purchaseAgg = await Form.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: null, total: { $sum: "$bidPrice" } } }
    ]);
    const totalPurchase = purchaseAgg.length > 0 ? purchaseAgg[0].total : 0;

    // 3. Total Sale (Sum of salePrice for sold inventory)
    const saleAgg = await Inventory.aggregate([
      { $match: { status: 'Sold' } },
      { $group: { _id: null, total: { $sum: "$salePrice" } } }
    ]);
    const totalSale = saleAgg.length > 0 ? saleAgg[0].total : 0;

    // 4. Submissions Chart Data (Group by Month)
    const currentYear = new Date().getFullYear();
    const chartAgg = await Form.aggregate([
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" } // 1-12
        }
      },
      { $match: { year: currentYear } },
      {
        $group: {
          _id: "$month",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = months.map((month, index) => {
      const found = chartAgg.find(item => item._id === index + 1);
      return {
        name: month,
        submissions: found ? found.count : 0
      };
    });

    // 5. Brand Chart Data (Join with Mobile to get Brand)
    const brandAgg = await Form.aggregate([
      {
        $lookup: {
          from: "mobiles",
          localField: "mobileId",
          foreignField: "_id",
          as: "mobile"
        }
      },
      { $unwind: "$mobile" },
      {
        $group: {
          _id: "$mobile.brand",
          value: { $sum: 1 }
        }
      }
    ]);

    const brandData = brandAgg.map(item => ({
      name: item._id || 'Unknown',
      value: item.value
    }));

    // 6. Condition Chart Data
    const conditionAgg = await Form.aggregate([
      {
        $group: {
          _id: "$condition",
          value: { $sum: 1 }
        }
      }
    ]);

    const conditionData = conditionAgg.map(item => ({
      name: item._id || 'Unknown',
      value: item.value
    }));

    // 7. Recent Submissions (Top 5)
    const recentSubmissions = await Form.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('mobileId', 'brand phoneModel')
      .lean();

    res.json({
      totalSubmissions,
      pendingOrders,
      acceptedDeals,
      rejectedDeals,
      totalUsers,
      totalPurchase,
      totalSale,
      chartData,
      brandData,
      conditionData,
      recentSubmissions
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};
// ── WALLET BALANCE API (Truth from Forms) ──────────────────────────────────
export const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    // 1. Find all forms with status 'accepted' for this user
    const acceptedForms = await Form.find({ userId, status: "accepted" });
    const realBalance = acceptedForms.reduce((sum, f) => sum + (parseFloat(f.bidPrice) || 0), 0);

    // 2. Sync Wallet document (Ensures it's never out of sync)
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $set: { balance: realBalance } },
      { upsert: true, new: true }
    );

    // Return the verified balance and pending order IDs
    res.json({
      balance: wallet.balance,
      totalEarnings: wallet.totalEarnings,
      totalWithdrawn: wallet.totalWithdrawn,
      pendingActions: acceptedForms.map(f => ({ orderId: f._id, amount: f.bidPrice }))
    });

  } catch (error) {
    console.error("❌ Wallet Balance Error:", error);
    res.status(500).json({ message: "Wallet fetch failed" });
  }
};

// ── GUEST WALLET BALANCE (For LocalStorage persistence) ─────────────────────
export const getGuestWalletBalance = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(200).json({ balance: 0, pendingActions: [] });
    }

    // Find accepted guest forms (ONLY those that are truly unassigned)
    const acceptedForms = await Form.find({
      _id: { $in: orderIds },
      $or: [
        { userId: null },
        { userId: { $exists: false } }
      ],
      status: "accepted"
    });

    const balance = acceptedForms.reduce((sum, f) => sum + (parseFloat(f.bidPrice) || 0), 0);

    res.json({
      balance,
      pendingActions: acceptedForms.map(f => ({ orderId: f._id, amount: f.bidPrice }))
    });

  } catch (error) {
    console.error("❌ Guest Wallet Error:", error);
    res.status(500).json({ message: "Guest balance fetch failed" });
  }
};

// ── BRIDGE GUEST ORDERS ───────────────────────────────────────────────
export const bridgeGuestOrders = async (req, res) => {
  try {
    const { userId, orderIds } = req.body;

    if (!userId || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "User ID and Order IDs array required" });
    }

    // 1. Find the guest forms to calculate balance
    const guestForms = await Form.find({
      _id: { $in: orderIds },
      userId: null,
      status: "accepted"
    });

    const bridgeAmount = guestForms.reduce((sum, f) => sum + (parseFloat(f.bidPrice) || 0), 0);

    // 2. Link all specified forms to this user
    const result = await Form.updateMany(
      { _id: { $in: orderIds }, userId: null },
      { $set: { userId: userId } }
    );

    // 3. Update DB Wallet
    if (bridgeAmount > 0) {
      await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: bridgeAmount, totalEarnings: bridgeAmount } },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Orders bridged successfully", modified: result.modifiedCount, bridgeAmount });
  } catch (error) {
    console.error("❌ Bridge Error:", error);
    res.status(500).json({ message: "Bridging failed", error: error.message });
  }
};
