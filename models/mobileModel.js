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
    // Generic map of questionKey -> { optionKey: percentDeduction }, matching whatever
    // Category.assessmentQuestions defines for this product's category. Kept as Mixed
    // (rather than a fixed screen/body/battery sub-schema) so any category's question
    // set can be stored the same way — existing {screen,body,battery} data reads back
    // identically under Mixed, no migration needed.
    deductionRules: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true })

export const Mobile = mongoose.model('Mobile', mobileSchema);