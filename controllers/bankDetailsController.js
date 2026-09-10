import { BankDetails } from "../models/bankDetailsModel.js";
import { Wallet } from "../models/walletModel.js";
import { Form } from "../models/formModel.js";
import { sendEmail, getPayoutSentTemplate } from "../utils/emailService.js";
import { sendSMS, getPayoutSentSMS } from "../utils/smsService.js";

//add bank details (supports bank + zelle)
export const addBankDetails = async (req, res) => {
    try {
        const { userId, accountNumber, accountHolderName, bankName, amount, status, payoutMethod, zelleContact, zelleContactType } = req.body;
        const method = payoutMethod || 'bank';

        // Validate based on payout method
        if (method === 'bank') {
            if (!accountNumber || !bankName) {
                return res.status(400).json({ message: 'Account number and bank name are required for bank withdrawal.' });
            }
        } else if (method === 'zelle') {
            if (!zelleContact || !zelleContactType) {
                return res.status(400).json({ message: 'Zelle contact info is required for Zelle withdrawal.' });
            }
        }

        const bankDetails = await BankDetails.create({
            userId, accountHolderName, amount, status,
            payoutMethod: method,
            // Bank fields
            ...(method === 'bank' && { accountNumber, bankName }),
            // Zelle fields
            ...(method === 'zelle' && { zelleContact, zelleContactType }),
        });

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

        // ✅ Send response FIRST (non-blocking)
        res.status(200).json(bankDetails);

        // ✅ Send Payout Confirmation Email + SMS in background (fire-and-forget)
        if (status === 'paid' && oldDetails.status !== 'paid') {
            const subject = 'Payment Processed - CashMish';
            const html = getPayoutSentTemplate(
                bankDetails.userId.name,
                bankDetails.amount
            );

            sendEmail({
                email: bankDetails.userId.email,
                subject,
                html,
            }).then(() => {
                console.log(`[DEBUG] Payout email sent successfully to ${bankDetails.userId.email}`);
            }).catch(emailError => {
                console.error("📧 Payout email error:", emailError.message);
            });

            // User model has no phone field, so pull the most recent
            // pickup phone number from this user's own forms.
            Form.findOne({ userId: bankDetails.userId._id || bankDetails.userId })
                .sort({ createdAt: -1 })
                .then((latestForm) => {
                    const phone = latestForm?.pickUpDetails?.phoneNumber;
                    if (!phone) {
                        console.warn(`[DEBUG] No phone number found for user ${bankDetails.userId._id}, skipping payout SMS.`);
                        return;
                    }

                    const smsText = getPayoutSentSMS(bankDetails.userId.name, bankDetails.amount);

                    sendSMS({ phone, message: smsText })
                        .then(() => console.log(`[DEBUG] Payout SMS sent successfully to ${phone}`))
                        .catch((smsError) => console.error("📱 Payout SMS error:", smsError.message));
                })
                .catch((err) => console.error("📱 Payout SMS lookup error:", err.message));
        }
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
