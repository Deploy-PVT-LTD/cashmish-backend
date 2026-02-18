import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        balance: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        totalWithdrawn: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
