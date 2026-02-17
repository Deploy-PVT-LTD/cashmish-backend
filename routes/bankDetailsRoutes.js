import express from "express";
import { addBankDetails, getBankDetails, updateBankDetails, deleteBankDetails, getBankDetailsByUserId } from "../controllers/bankDetailsController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", addBankDetails);
router.get("/", auth, getBankDetails);
router.put("/:id", auth, updateBankDetails);
router.delete("/:id", auth, deleteBankDetails);
router.get("/user/:userId", auth, getBankDetailsByUserId);

export default router;
