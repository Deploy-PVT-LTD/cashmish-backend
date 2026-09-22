import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    icon: {
        type: String, // image URL (or leave blank to use a default icon on the frontend)
        default: ''
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },

    // --- Sell-flow configuration (lets each category define its own steps) ---

    // Carrier/lock-status step (only meaningful for phones) — off by default for new categories.
    hasCarrierStep: {
        type: Boolean,
        default: false
    },
    carrierOptions: {
        type: [String],
        default: []
    },

    // Storage step — off by default; admin turns it on and fills in sizes that make sense
    // for the category (e.g. Gaming Consoles: 500GB/825GB/1TB/2TB).
    hasStorageStep: {
        type: Boolean,
        default: false
    },
    storageOptions: {
        type: [String],
        default: []
    },

    // The device condition assessment: a fully custom list of questions per category.
    // Each option's `deduction` is just the category-level DEFAULT % used to pre-fill a
    // new product's own deductionRules in the admin panel — the actual price impact for
    // a given product always comes from that product's own deductionRules (customizable
    // per product, same as today), keyed by these same question/option keys.
    assessmentQuestions: {
        type: [{
            key: { type: String, required: true, trim: true, lowercase: true },
            label: { type: String, required: true, trim: true },
            options: {
                type: [{
                    key: { type: String, required: true, trim: true, lowercase: true },
                    label: { type: String, required: true, trim: true },
                    description: { type: String, default: '' },
                    deduction: { type: Number, default: 0 }
                }],
                default: []
            }
        }],
        default: []
    }
}, { timestamps: true });

export const Category = mongoose.model('Category', categorySchema);
