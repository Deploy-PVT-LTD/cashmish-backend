import { addMobile, getMobileById, getMobiles, updateMobile, deleteMobile, getMobilesByBrand } from "../controllers/mobileController.js";
import express from "express";

const router = express.Router();

// 1. Post hamesha top par rakh sakte hain
router.post("/", addMobile);

// 2. GET ALL
router.get("/", getMobiles);

// 3. BRAND wala route ID se upar hona chahiye (ZAROORI HAI)
router.get("/brand", getMobilesByBrand); 

// 4. ID wala route sabse niche hona chahiye
router.get("/:id", getMobileById);
router.put("/:id", updateMobile);
router.delete("/:id", deleteMobile);

export default router;