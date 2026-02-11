import { Form } from "../models/formModel.js";
import { Mobile } from "../models/mobileModel.js";
import { User } from "../models/userModel.js";
import { Inventory } from "../models/inventoryModel.js";
import cloudinary from "../config/cloudinary.js";
import { calculatePrice } from "../utils/priceCalculator.js";
import streamifier from "streamifier";

import { PriceConfig } from "../models/priceConfigModel.js";

//form controllers
export const createForm = async (req, res) => {
  try {
    let {
      userId,
      mobileId,
      storage,
      carrier,
      screenCondition,
      bodyCondition,
      batteryCondition,
      pickUpDetails
    } = req.body;

    if (typeof pickUpDetails === "string") {
      pickUpDetails = JSON.parse(pickUpDetails.trim());
    }

    if (!mobileId || !pickUpDetails) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    /* upload images */
    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "reseller_forms" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          streamifier.createReadStream(file.buffer).pipe(stream);
        });

        imageUrls.push(uploaded.secure_url);
      }
    }

    /* determine effective rules (global + mobile overrides) */
    let globalRules = await PriceConfig.findOne();
    let effectiveRules = globalRules ? JSON.parse(JSON.stringify(globalRules)) : undefined;

    if (mobile.deductionRules) {
      if (!effectiveRules) effectiveRules = {};

      if (mobile.deductionRules.screen) effectiveRules.screen = { ...effectiveRules.screen, ...mobile.deductionRules.screen };
      if (mobile.deductionRules.body) effectiveRules.body = { ...effectiveRules.body, ...mobile.deductionRules.body };
      if (mobile.deductionRules.battery) effectiveRules.battery = { ...effectiveRules.battery, ...mobile.deductionRules.battery };
    }

    /* calculate price */
    const estimatedPrice = calculatePrice(mobile.basePrice, {
      storage,
      screen: screenCondition,
      body: bodyCondition,
      battery: batteryCondition
    }, effectiveRules);

    const form = await Form.create({
      userId,
      mobileId,
      storage,
      carrier,
      screenCondition,
      bodyCondition,
      batteryCondition,
      images: imageUrls,
      estimatedPrice,
      pickUpDetails
    });

    res.status(201).json(form);
  } catch (error) {
    console.error("CREATE FORM ERROR 👉", error);
    res.status(500).json({
      message: "Form creation failed",
      error: error.message,
      stack: error.stack
    });
  }

};

//get all forms
export const getAllForms = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      // Submissions store pickUpDetails as an object, but we can search inside it if we know the structure.
      // However, typical 'find' on subdocuments works.
      query.$or = [
        { "pickUpDetails.fullName": searchRegex },
        { "pickUpDetails.email": searchRegex },
        { "pickUpDetails.phone": searchRegex },
        { status: searchRegex }
      ];
    }

    const total = await Form.countDocuments(query);
    const forms = await Form.find(query)
      .populate("mobileId")
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      forms,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch forms" });
  }
};

//get single form by id
export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate("mobileId")
      .populate("userId");

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

//update form
export const updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const allowedFields = [
      "storage",
      "carrier",
      "screenCondition",
      "bodyCondition",
      "batteryCondition",
      "pickUpDetails",
      "status",
      "bidPrice"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        form[field] = req.body[field];
      }
    });

    /* recalc price if needed */
    if (
      req.body.storage ||
      req.body.screenCondition ||
      req.body.bodyCondition ||
      req.body.batteryCondition
    ) {
      const mobile = await Mobile.findById(form.mobileId);
      let globalRules = await PriceConfig.findOne();

      let effectiveRules = globalRules ? JSON.parse(JSON.stringify(globalRules)) : undefined;

      if (mobile.deductionRules) {
        if (!effectiveRules) effectiveRules = {};
        if (mobile.deductionRules.screen) effectiveRules.screen = { ...effectiveRules.screen, ...mobile.deductionRules.screen };
        if (mobile.deductionRules.body) effectiveRules.body = { ...effectiveRules.body, ...mobile.deductionRules.body };
        if (mobile.deductionRules.battery) effectiveRules.battery = { ...effectiveRules.battery, ...mobile.deductionRules.battery };
      }

      form.estimatedPrice = calculatePrice(mobile.basePrice, {
        storage: form.storage,
        screen: form.screenCondition,
        body: form.bodyCondition,
        battery: form.batteryCondition
      }, effectiveRules);
    }

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Form update failed" });
  }
};

//delete form
export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await form.deleteOne();
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Form delete failed" });
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