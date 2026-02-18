import express from "express";
import {
  createForm,
  getAllForms,
  updateForm,
  getFormById,
  deleteForm,
  getWalletBalance,
  getDashboardStats,
  getEstimate,
  bridgeGuestOrders,
} from "../controllers/formController.js";
import upload from "../middleware/upload.js";


const router = express.Router();

router.get("/stats", getDashboardStats);
router.post("/estimate", getEstimate);
router.post("/", upload.array("images", 5), createForm);
router.get("/", getAllForms);
router.get("/wallet-balance/:userId", getWalletBalance);
router.post("/bridge", bridgeGuestOrders);
router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;