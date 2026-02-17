import { Coupon } from "../models/couponModel.js";

// Create coupon
export const createCoupon = async (req, res) => {
    try {
        const { name, code, amount } = req.body;
        const exists = await Coupon.findOne({ code });
        if (exists) return res.status(400).json({ message: "Coupon code already exists" });

        const coupon = await Coupon.create({ name, code, amount });
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all coupons
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update coupon
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, amount, isActive } = req.body;

        const coupon = await Coupon.findByIdAndUpdate(
            id,
            { name, code, amount, isActive },
            { new: true }
        );

        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        res.status(200).json(coupon);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
