import mongoose from "mongoose";

const draftOrderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One draft per user (upsert overwrites)
        },
        mobileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Mobile",
            default: null,
        },
        brand: { type: String, default: null },
        model: { type: String, default: null },
        condition: { type: String, default: null },
        storage: { type: String, default: null },
        carrier: { type: String, default: null },
        mobileImage: { type: String, default: null },
        currentStep: {
            type: String,
            enum: ["brand", "model", "condition", "storage", "carrier", "assessment"],
            default: "brand",
        },
    },
    { timestamps: true }
);

export const DraftOrder = mongoose.model("DraftOrder", draftOrderSchema);
