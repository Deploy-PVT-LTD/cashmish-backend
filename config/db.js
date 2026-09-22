import mongoose from "mongoose";
import keys from "./keys.js";
import { Category } from "../models/categoryModel.js";
import { Mobile } from "../models/mobileModel.js";

// Exactly mirrors the sell flow's original hardcoded phone questions/steps, so turning
// this into per-category, admin-editable config doesn't change behavior for the one
// category (Mobile Phones) that already has real customers and real submissions.
const LEGACY_MOBILE_PHONE_CONFIG = {
    hasCarrierStep: true,
    carrierOptions: ['AT&T', 'Verizon', 'Sprint', 'T-Mobile', 'Unlocked', 'Other'],
    hasStorageStep: true,
    storageOptions: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
    assessmentQuestions: [
        {
            key: 'screen', label: 'Screen Condition (Front Display)', options: [
                { key: 'perfect', label: 'Perfect', description: 'No scratches, cracks, or visible marks', deduction: 0 },
                { key: 'scratched', label: 'Scratched', description: 'Minor surface scratches visible', deduction: 10 },
                { key: 'cracked', label: 'Cracked', description: 'Visible cracks, chips, or display damage', deduction: 25 },
            ]
        },
        {
            key: 'body', label: 'Back & Frame Condition', options: [
                { key: 'perfect', label: 'Perfect', description: 'Like new with no visible wear', deduction: 0 },
                { key: 'scratched', label: 'Scratched', description: 'Minor scratches or light wear', deduction: 10 },
                { key: 'damaged', label: 'Damaged', description: 'Visible dents, cracks, or structural damage', deduction: 20 },
            ]
        },
        {
            key: 'battery', label: 'Battery Health', options: [
                { key: 'good', label: 'Good (80%+)', description: 'Battery health 80% or higher', deduction: 0 },
                { key: 'average', label: 'Average (60-80%)', description: 'Battery health between 60%–79%', deduction: 10 },
                { key: 'poor', label: 'Poor (<60%)', description: 'Battery health below 60%', deduction: 20 },
            ]
        },
    ]
};

// One-time, idempotent setup so existing data keeps working after categories were introduced:
// - ensure a default "Mobile Phones" category exists, with its sell-flow config backfilled
//   to match the app's original hardcoded behavior exactly
// - backfill any product created before categories existed
const seedDefaultCategory = async () => {
    try {
        let mobilesCategory = await Category.findOne({ slug: 'mobile-phones' });
        if (!mobilesCategory) {
            mobilesCategory = await Category.create({ name: 'Mobile Phones', slug: 'mobile-phones', order: 0, ...LEGACY_MOBILE_PHONE_CONFIG });
            console.log("🌱 Seeded default 'Mobile Phones' category");
        } else if (!mobilesCategory.assessmentQuestions || mobilesCategory.assessmentQuestions.length === 0) {
            await Category.updateOne({ _id: mobilesCategory._id }, { $set: LEGACY_MOBILE_PHONE_CONFIG });
            console.log("🌱 Backfilled sell-flow config onto 'Mobile Phones' category");
        }

        const backfillResult = await Mobile.updateMany(
            { $or: [{ category: { $exists: false } }, { category: null }, { category: '' }] },
            { $set: { category: 'mobile-phones' } }
        );
        if (backfillResult.modifiedCount > 0) {
            console.log(`🌱 Backfilled category on ${backfillResult.modifiedCount} existing product(s)`);
        }
    } catch (error) {
        console.error("Category seeding error:", error.message);
    }
};

export const connectDB = async () => {
    try {
        await mongoose.connect(keys.mongoUri, {
            maxPoolSize: 50, // Optimize database connection handling
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("MongoDB connected successfully");
        await seedDefaultCategory();
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}