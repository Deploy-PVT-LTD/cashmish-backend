import express from "express";
import { saveDraft, getUserDrafts, deleteDraft } from "../controllers/draftOrderController.js";

const router = express.Router();

router.post("/", saveDraft);
router.get("/:userId", getUserDrafts);
router.delete("/:userId", deleteDraft);

export default router;
