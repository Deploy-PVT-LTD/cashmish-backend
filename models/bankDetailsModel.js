import mongoose from "mongoose";

const bankDetailsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    bankName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "paid", "rejected"],
        default: "pending"
    }
}, { timestamps: true })

export const BankDetails = mongoose.model("BankDetails", bankDetailsSchema)
