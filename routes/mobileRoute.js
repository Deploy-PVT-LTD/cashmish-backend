import { addMobile, getMobileById, getMobiles, updateMobile, deleteMobile, getMobilesByBrand, getMobileRequests, approveRequest, rejectRequest } from "../controllers/mobileController.js";
import express from "express";
import passport from "passport";

const router = express.Router();
const requireAuth = passport.authenticate("jwt", { session: false });

// 1. Post hamesha top par rakh sakte hain
router.post("/", requireAuth, addMobile);

// 2. GET ALL
router.get("/", getMobiles);

// 3. BRAND wala route ID se upar hona chahiye (ZAROORI HAI)
router.get("/brand", getMobilesByBrand);

// 3.5 REQUESTS (Super Admin)
router.get("/requests", requireAuth, getMobileRequests);
router.post("/requests/:id/approve", requireAuth, approveRequest);
router.post("/requests/:id/reject", requireAuth, rejectRequest);

// 4. ID wala route sabse niche hona chahiye
router.get("/:id", getMobileById);
router.put("/:id", requireAuth, updateMobile);
router.delete("/:id", requireAuth, deleteMobile);

export default router;