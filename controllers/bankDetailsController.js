import { BankDetails } from "../models/bankDetailsModel.js";

//add bank details
export const addBankDetails = async (req, res) => {
    try {
        const { userId, accountNumber, accountHolderName, bankName } = req.body;
        const bankDetails = await BankDetails.create({ userId, accountNumber, accountHolderName, bankName, bankBranch });
        res.status(201).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//get all bank details
export const getBankDetails = async (req, res) => {
    try {
        const bankDetails = await BankDetails.find();
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//update bank details
export const updateBankDetails = async (req, res) => {
    try {
        const { userId, accountNumber, accountHolderName, bankName } = req.body;
        const bankDetails = await BankDetails.findOneAndUpdate({ userId }, { userId, accountNumber, accountHolderName, bankName, bankBranch });
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//delete bank details
export const deleteBankDetails = async (req, res) => {
    try {
        const { userId } = req.body;
        const bankDetails = await BankDetails.findOneAndDelete({ userId });
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//get bank details by user id
export const getBankDetailsByUserId = async (req, res) => {
    try {
        const { userId } = req.body;
        const bankDetails = await BankDetails.findOne({ userId });
        res.status(200).json(bankDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
