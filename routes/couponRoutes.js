import express from "express";
import { createCoupon, getCoupons, updateCoupon, deleteCoupon } from "../controllers/couponController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createCoupon);
router.get("/", auth, getCoupons);
router.put("/:id", auth, updateCoupon);
router.delete("/:id", auth, deleteCoupon);

export default router;
