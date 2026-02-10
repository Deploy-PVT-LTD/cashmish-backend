import { Mobile } from "../models/mobileModel.js";

//   ADD MOBILE (ADMIN)

export const addMobile = async (req, res) => {
  try {
    const { brand, phoneModel, basePrice, image, deductionRules } = req.body;

    const mobile = await Mobile.create({
      brand,
      phoneModel,
      basePrice,
      image,
      deductionRules
    });

    res.status(201).json(mobile);
  } catch (error) {
    res.status(500).json({ message: "Failed to add mobile" });
  }
};

//   GET ALL MOBILES (USER)
//   only active
export const getMobiles = async (req, res) => {
  try {
    const mobiles = await Mobile.find({ isActive: true });
    res.json(mobiles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobiles" });
  }
};

//   GET MOBILE BY ID
export const getMobileById = async (req, res) => {
  try {
    const mobile = await Mobile.findById(req.params.id);

    if (!mobile || !mobile.isActive) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobile" });
  }
};

//   GET MOBILES BY BRAND
export const getMobilesByBrand = async (req, res) => {
  try {
    const { brand } = req.query;

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    const mobiles = await Mobile.find({
      brand: { $regex: new RegExp(`^${brand}$`, "i") },
      isActive: true
    }).select("phoneModel _id image");

    res.json(mobiles);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mobiles" });
  }
};

//   UPDATE MOBILE (ADMIN – SAFE)
export const updateMobile = async (req, res) => {
  try {
    const updates = {};
    const fields = ["brand", "phoneModel", "basePrice", "isActive", "image", "deductionRules"];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const mobile = await Mobile.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json(mobile);
  } catch (error) {
    res.status(500).json({ message: "Mobile update failed" });
  }
};

//   DELETE MOBILE (ADMIN – SOFT DELETE)
export const deleteMobile = async (req, res) => {
  try {
    const mobile = await Mobile.findByIdAndDelete(req.params.id);

    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    res.json({ message: "Mobile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Mobile delete failed" });
  }
};
