import { Form } from "../models/formModel.js";
import { Mobile } from "../models/mobileModel.js";
import { User } from "../models/userModel.js";
import { Inventory } from "../models/inventoryModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { PriceConfig } from "../models/priceConfigModel.js";
import { calculatePrice } from "../utils/priceCalculator.js";
import { Wallet } from "../models/walletModel.js";
import {
  sendEmail,
  getFormConfirmationTemplate,
  getBidStatusTemplate,
  getAdminBidOfferTemplate,
  getAcceptPriceTemplate
} from "../utils/emailService.js";

export const createForm = async (req, res) => {
  try {
    let {
      mobileId,
      storage,
      carrier,
      condition,
      screenCondition,
      bodyCondition,
      batteryCondition,
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
            { folder: "forms" },
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

    // Get pricing rules
    let globalRules = await PriceConfig.findOne();
    let effectiveRules = globalRules
      ? JSON.parse(JSON.stringify(globalRules))
      : {};

    // Apply mobile-specific deduction rules
    if (mobile.deductionRules) {
      if (mobile.deductionRules.screen)
        effectiveRules.screen = {
          ...effectiveRules.screen,
          ...mobile.deductionRules.screen,
        };
      if (mobile.deductionRules.body)
        effectiveRules.body = {
          ...effectiveRules.body,
          ...mobile.deductionRules.body,
        };
      if (mobile.deductionRules.battery)
        effectiveRules.battery = {
          ...effectiveRules.battery,
          ...mobile.deductionRules.battery,
        };
    }

    // Calculate estimated price
    const estimatedPrice = calculatePrice(
      mobile.basePrice,
      {
        storage,
        screen: screenCondition,
        body: bodyCondition,
        battery: batteryCondition,
      },
      effectiveRules
    );

    // Prepare form data
    const formData = {
      mobileId,
      storage,
      carrier,
      condition,
      screenCondition,
      bodyCondition,
      batteryCondition,
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
    } catch (error) {
      // Silent error for email template generation
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
      screenCondition,
      bodyCondition,
      batteryCondition,
    } = req.body;

    if (!mobileId) {
      return res.status(400).json({ message: "Mobile ID is required" });
    }

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) return res.status(404).json({ message: "Mobile not found" });

    // Get pricing rules
    let globalRules = await PriceConfig.findOne();
    let effectiveRules = globalRules
      ? JSON.parse(JSON.stringify(globalRules))
      : {};

    // Apply mobile-specific deduction rules
    if (mobile.deductionRules) {
      if (mobile.deductionRules.screen)
        effectiveRules.screen = {
          ...effectiveRules.screen,
          ...mobile.deductionRules.screen,
        };
      if (mobile.deductionRules.body)
        effectiveRules.body = {
          ...effectiveRules.body,
          ...mobile.deductionRules.body,
        };
      if (mobile.deductionRules.battery)
        effectiveRules.battery = {
          ...effectiveRules.battery,
          ...mobile.deductionRules.battery,
        };
    }

    // Calculate estimated price
    const estimatedPrice = calculatePrice(
      mobile.basePrice,
      {
        storage,
        screen: screenCondition,
        body: bodyCondition,
        battery: batteryCondition,
      },
      effectiveRules
    );

    res.json({ estimatedPrice });
  } catch (error) {
    console.error("❌ Estimate calculation error:", error);
    res.status(500).json({ message: "Estimate calculation failed", error: error.message });
  }
};


export const getAllForms = async (req, res) => {
  try {
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

    // Send refined email notifications
    const statusChanged = req.body.status && req.body.status !== oldStatus;
    const bidUpdated = req.body.bidPrice !== undefined && Number(req.body.bidPrice) !== Number(oldBidPrice);

    if (statusChanged || bidUpdated) {
      let html = '';
      let subject = '';

      if (bidUpdated && (!req.body.status || req.body.status === 'pending' || req.body.status === 'bid_placed')) {
        subject = 'New Bid Offer for Your Device - CashMish';
        html = getAdminBidOfferTemplate(
          form.pickUpDetails.fullName,
          `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
          req.body.bidPrice, // Use new bid price
          form._id
        );
      } else if (req.body.status === 'accepted' && statusChanged) {
        subject = 'Trade-in Price Accepted - CashMish';
        // ... (template logic for accepted) ...
        html = getAcceptPriceTemplate(
          form.pickUpDetails.fullName,
          `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
          form.bidPrice || form.estimatedPrice
        );
      } else if (req.body.status === 'rejected' && statusChanged) {
        // ... (template logic for rejected) ...
        subject = 'Trade-in Request Status Update - CashMish';
        html = getBidStatusTemplate(
          form.pickUpDetails.fullName,
          `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
          'rejected',
          0
        );
      }

      if (subject && html && form.userId && form.userId.email) {
        console.log(`[DEBUG] Attempting to send email for Form ID: ${form._id}`);
        console.log(`[DEBUG] Subject: ${subject}`);
        console.log(`[DEBUG] Recipient: ${form.userId.email}`);

        try {
          await sendEmail({
            email: form.userId.email,
            subject,
            html
          });
          console.log(`[DEBUG] Email sent successfully for form update`);
        } catch (emailErr) {
          console.error(`[DEBUG] Failed to send form update email:`, emailErr);
        }
      }
    }

    res.json(form);
  } catch (error) {
    console.error("❌ Update form error:", error);
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });

    console.log("🗑️ Form deleted:", req.params.id);

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

    // Find accepted guest forms
    const acceptedForms = await Form.find({
      _id: { $in: orderIds },
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
