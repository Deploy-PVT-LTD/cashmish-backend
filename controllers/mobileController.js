import { Mobile } from "../models/mobileModel.js";

// 1. Add a new mobile phone
export const addMobile = async (req, res) => {
    try {
        const { brand, phoneModel, basePrice } = req.body;
        const newMobile = new Mobile({ brand, phoneModel, basePrice });
        await newMobile.save();
        res.status(201).json({ message: "Mobile phone added successfully", mobile: newMobile });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 2. Get all mobile phones
export const getMobiles = async (req, res) => {
    try {
        const mobiles = await Mobile.find();
        res.status(200).json(mobiles);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 3. Get a mobile phone by ID
export const getMobileById = async (req, res) => {
    try {
        const mobile = await Mobile.findById(req.params.id);
        if (!mobile) {
            return res.status(404).json({ message: "Mobile phone not found" });
        }
        res.status(200).json(mobile);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getMobilesByBrand = async (req, res) => {
  try {
    const { brand } = req.query;
    console.log("Searching for brand:", brand);

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    const mobiles = await Mobile.find({
      brand: { $regex: new RegExp(`^${brand}$`, 'i') }
    }).select("phoneModel _id"); 

    res.status(200).json(mobiles);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};


// 5. Update a mobile phone
export const updateMobile = async (req, res) => {
    try {
        const { brand, phoneModel, basePrice, isActive } = req.body;
        const mobile = await Mobile.findByIdAndUpdate(
            req.params.id,
            { brand, phoneModel, basePrice, isActive },
            { new: true }
        );
        if (!mobile) {
            return res.status(404).json({ message: "Mobile phone not found" });
        }
        res.status(200).json({ message: "Mobile phone updated successfully", mobile });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 6. Delete a mobile phone
export const deleteMobile = async (req, res) => {
    try {
        const mobile = await Mobile.findByIdAndDelete(req.params.id);
        if (!mobile) {
            return res.status(404).json({ message: "Mobile phone not found" });
        }
        res.status(200).json({ message: "Mobile phone deleted successfully", mobile });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};