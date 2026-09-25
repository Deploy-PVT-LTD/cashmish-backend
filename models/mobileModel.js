import mongoose from "mongoose";

const mobileSchema = new mongoose.Schema({
    // Category slug (e.g. "mobile-phones", "laptops", "gaming-consoles") — see Category model.
    // Defaults to "mobile-phones" for backward compatibility with items added before categories existed.
    category: {
        type: String,
        default: 'mobile-phones',
        lowercase: true,
        trim: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    phoneModel: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: [0, "Base Price cannot be negative"]
    },
    basePriceLocked: {
        type: Number,
        default: 0,
        min: [0, "Locked Price cannot be negative"]
    },
    image: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // LEGACY percentage-deduction system. Kept (not removed/migrated) purely as a
    // fallback: any product that has no gradePricing configured yet (e.g. a brand
    // not covered by a grade-price import, or a category still being set up) keeps
    // pricing exactly as before — zero regression. New/updated products should use
    // gradePricing below instead; the estimate calculator always prefers it.
    deductionRules: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Grade-wise price table — the current pricing system. Customers no longer get a
    // percentage knocked off a base price; instead the condition answers they give are
    // reduced to a single letter grade (A = best … F = worst, see
    // utils/priceCalculator.js#computeGrade) and that grade is looked up here directly
    // for an exact dollar amount, split by storage size and lock status.
    //
    // Shape:
    //   {
    //     "<storageKey or 'default'>": {
    //       unlockedBase: Number,   // reference/"worth up to" price, informational only
    //       lockedBase: Number,
    //       unlocked: { A: Number, B: Number, C: Number, D: Number, E: Number, F: Number },
    //       locked:   { A: Number, B: Number, C: Number, D: Number, E: Number, F: Number }
    //     }, ...
    //   }
    // Categories without a storage step (hasStorageStep: false) just use the single
    // key "default". Kept as Mixed for the same reason as deductionRules — works for
    // any category's storage options without a schema change per category.
    gradePricing: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true })

export const Mobile = mongoose.model('Mobile', mobileSchema);