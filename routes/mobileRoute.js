import { addMobile, getMobileById, getMobiles, updateMobile, deleteMobile, getMobilesByBrand, getMobileRequests, approveRequest, rejectRequest } from "../controllers/mobileController.js";
import express from "express";
import passport from "passport";

const router = express.Router();
const requireAuth = passport.authenticate("jwt", { session: false });

router.post("/", requireAuth, addMobile);

//  GET ALL
router.get("/", getMobiles);

// GET BRANDS
router.get("/brand", getMobilesByBrand);

// REQUESTS (Super Admin)
router.get("/requests", requireAuth, getMobileRequests);
router.post("/requests/:id/approve", requireAuth, approveRequest);
router.post("/requests/:id/reject", requireAuth, rejectRequest);

// ID Routes
router.get("/:id", getMobileById);
router.put("/:id", requireAuth, updateMobile);
router.delete("/:id", requireAuth, deleteMobile);

export default router;