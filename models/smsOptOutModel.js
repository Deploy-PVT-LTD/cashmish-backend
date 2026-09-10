import mongoose from "mongoose";

const smsOptOutSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true },
    reason: { type: String, default: "user_reply" }, // e.g. "STOP" keyword
  },
  { timestamps: true }
);

export const SmsOptOut = mongoose.model("SmsOptOut", smsOptOutSchema);
