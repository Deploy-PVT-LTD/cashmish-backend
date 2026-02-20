import { BankDetails } from "../models/bankDetailsModel.js";
import { Wallet } from "../models/walletModel.js";
import { Form } from "../models/formModel.js";
import { sendEmail, getPayoutSentTemplate } from "../utils/emailService.js";

//add bank details
export const addBankDetails = async (req, res) => {
    try {
        const { userId, accountNumber, accountHolderName, bankName, amount, status } = req.body;
        const bankDetails = await BankDetails.create({ userId, accountNumber, accountHolderName, bankName, amount, status });

        // ✅ Reset Wallet Balance in DB
        await Wallet.findOneAndUpdate(
            { userId },
            { $set: { balance: 0 }, $inc: { totalWithdrawn: 0 } }, // totalWithdrawn logic can be refined later if needed
            { upsert: true }
        );

        // ✅ Mark associated accepted forms as paid
        await Form.updateMany(
            { userId, status: 'accepted' },
            { $set: { status: 'paid' } }
        );

        res.status(201).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//get all bank details
export const getBankDetails = async (req, res) => {
    try {
        const bankDetails = await BankDetails.find().populate("userId", "name email").sort({ createdAt: -1 });
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//update bank details
export const updateBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, accountNumber, accountHolderName, bankName, status } = req.body;

        const oldDetails = await BankDetails.findById(id);
        if (!oldDetails) return res.status(404).json({ message: "Bank details not found" });

        const updateData = {};
        if (userId) updateData.userId = userId;
        if (accountNumber) updateData.accountNumber = accountNumber;
        if (accountHolderName) updateData.accountHolderName = accountHolderName;
        if (bankName) updateData.bankName = bankName;
        if (status) updateData.status = status;

        const bankDetails = await BankDetails.findByIdAndUpdate(id, updateData, { new: true }).populate("userId", "name email");

        // ✅ Send Payout Confirmation Email if status changed to 'paid'
        if (status === 'paid' && oldDetails.status !== 'paid') {
            console.log(`[DEBUG] Payout status changed to paid for BankDetails ID: ${id}. Sending email to ${bankDetails.userId.email}`);
            try {
                const subject = 'Payment Processed - CashMish';
                const html = getPayoutSentTemplate(
                    bankDetails.userId.name,
                    bankDetails.amount
                );

                await sendEmail({
                    email: bankDetails.userId.email,
                    subject,
                    html,
                });
                console.log(`[DEBUG] Payout email sent successfully to ${bankDetails.userId.email}`);
            } catch (emailError) {
                console.error("📧 Payout email error:", emailError);
            }
        } else {
            console.log(`[DEBUG] Status update for BankDetails ID: ${id}. Status: ${status}, Old Status: ${oldDetails.status}. Email NOT sent.`);
        }

        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//delete bank details
export const deleteBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const bankDetails = await BankDetails.findByIdAndDelete(id);
        res.status(200).json({ message: "Bank details deleted successfully", bankDetails });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//get bank details by user id
export const getBankDetailsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const bankDetails = await BankDetails.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
