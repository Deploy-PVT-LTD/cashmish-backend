import { DraftOrder } from "../models/draftOrderModel.js";

// POST /api/drafts — Upsert draft for current user
export const saveDraft = async (req, res) => {
    try {
        const { userId, brand, model, mobileId, mobileImage, condition, storage, carrier, currentStep } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const updateData = { currentStep: currentStep || "brand" };
        if (brand !== undefined) updateData.brand = brand;
        if (model !== undefined) updateData.model = model;
        if (mobileId !== undefined) updateData.mobileId = mobileId;
        if (mobileImage !== undefined) updateData.mobileImage = mobileImage;
        if (condition !== undefined) updateData.condition = condition;
        if (storage !== undefined) updateData.storage = storage;
        if (carrier !== undefined) updateData.carrier = carrier;

        const draft = await DraftOrder.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: "Draft saved", draft });
    } catch (error) {
        console.error("❌ Save draft error:", error);
        res.status(500).json({ message: "Failed to save draft", error: error.message });
    }
};

// GET /api/drafts/:userId — Get user's draft
export const getUserDrafts = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const draft = await DraftOrder.findOne({ userId }).populate("mobileId");
        res.status(200).json({ draft: draft || null });
    } catch (error) {
        console.error("❌ Get drafts error:", error);
        res.status(500).json({ message: "Failed to fetch drafts", error: error.message });
    }
};

// DELETE /api/drafts/:userId — Remove user's draft
export const deleteDraft = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        await DraftOrder.findOneAndDelete({ userId });
        res.status(200).json({ message: "Draft deleted" });
    } catch (error) {
        console.error("❌ Delete draft error:", error);
        res.status(500).json({ message: "Failed to delete draft", error: error.message });
    }
};
