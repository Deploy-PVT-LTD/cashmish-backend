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
    //
    // gradeRole drives how this question's answer feeds the single A-F grade computed
    // by utils/priceCalculator.js#computeGrade (see that file for the full algorithm):
    //   'cosmetic'            - option keys ARE grade letters (A-F); the worst (highest
    //                           letter) answer across all cosmetic questions wins. Use
    //                           `capAt` on a question to cap how bad ITS answer alone can
    //                           push the grade (e.g. a cracked back matters less than a
    //                           cracked screen).
    //   'display-defect'      - multi-select checklist; any answer other than `noneKey`
    //                           forces the grade to (at least) `forceGrade`.
    //   'functional'          - single-select pass/fail/unsure(/na); 'fail' marks the
    //                           whole submission as having a functional defect.
    //   'functional-checklist'- multi-select checklist (e.g. broken speaker/wifi); any
    //                           answer other than `noneKey` also marks a functional defect.
    // A functional defect floors the final grade at 'C' (can't come out better than C)
    // regardless of how good the cosmetic answers were — a phone can look mint and still
    // not be worth a mint price if it doesn't fully work.
    // Missing gradeRole defaults to 'cosmetic' with legacy severity-index behavior for
    // backward compatibility with any category that hasn't been migrated to this scheme.
    assessmentQuestions: {
        type: [{
            key: { type: String, required: true, trim: true, lowercase: true },
            label: { type: String, required: true, trim: true },
            subtitle: { type: String, default: '', trim: true }, // shown under the label on the assessment page
            gradeRole: {
                type: String,
                enum: ['cosmetic', 'display-defect', 'functional', 'functional-checklist'],
                default: 'cosmetic'
            },
            multi: { type: Boolean, default: false }, // true = checkbox multi-select answer
            capAt: { type: String, default: '' }, // cosmetic only: cap this question's own contribution at this grade letter
            forceGrade: { type: String, default: 'E' }, // display-defect only: grade forced when any defect is picked
            noneKey: { type: String, default: 'none' }, // display-defect / functional-checklist: the "no problem" option key
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
