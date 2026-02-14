import { Form } from "../models/formModel.js";
import { Mobile } from "../models/mobileModel.js";
import { User } from "../models/userModel.js";
import { Inventory } from "../models/inventoryModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import { PriceConfig } from "../models/priceConfigModel.js";
import { calculatePrice } from "../utils/priceCalculator.js";

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
      console.log("👤 GUEST USER - No userId");
    }

    const form = await Form.create(formData);

    // Populate mobile details before sending response
    await form.populate('mobileId');

    // Send confirmation email
    try {
      const { sendEmail, getFormConfirmationTemplate } = await import("../utils/emailService.js");
      const html = getFormConfirmationTemplate(
        form.pickUpDetails.fullName,
        `${form.mobileId.brand} ${form.mobileId.phoneModel}`,
        form.estimatedPrice
      );

      await sendEmail({
        email: form.pickUpDetails.email,
        subject: 'Form Submission Confirmation - CashMish',
        html,
      });
      console.log("📧 Confirmation email sent to:", form.pickUpDetails.email);
    } catch (emailError) {
      console.error("❌ Failed to send confirmation email:", emailError.message);
      // We don't fail the request if email fails
    }

    console.log("📝 Form created:", {
      id: form._id,
      userId: form.userId,
      phoneNumber: form.pickUpDetails?.phoneNumber,
      isGuest: !form.userId,
      status: form.status,
      bidPrice: form.bidPrice
    });

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

    // Update status
    if (req.body.status) {
      form.status = req.body.status;
    }

    // Update bidPrice (admin sets this)
    if (req.body.bidPrice !== undefined) {
      form.bidPrice = req.body.bidPrice;
    }

    await form.save();

    // Populate before sending response
    await form.populate('mobileId');
    await form.populate('userId', 'name email phoneNumber');

    console.log("✏️ Form updated:", {
      id: form._id,
      oldStatus,
      newStatus: form.status,
      bidPrice: form.bidPrice
    });

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

    // 6. Recent Submissions (Top 5)
    // Populate mobileId to get brand and model
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
      recentSubmissions
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
};