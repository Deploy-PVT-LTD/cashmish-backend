import { addMobile, getMobileById, getMobiles, updateMobile, deleteMobile, getMobilesByBrand, getMobileRequests, approveRequest, rejectRequest, bulkImportGradePricing } from "../controllers/mobileController.js";
import express from "express";
import passport from "passport";
import uploadExcel from "../middleware/uploadExcel.js";

const router = express.Router();
const requireAuth = passport.authenticate("jwt", { session: false });

router.post("/", requireAuth, addMobile);

// BULK GRADE-PRICE IMPORT (Excel/CSV upload) — before "/:id" so it isn't
// swallowed by that param route.
router.post("/bulk-import-grades", requireAuth, uploadExcel.single("file"), bulkImportGradePricing);

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