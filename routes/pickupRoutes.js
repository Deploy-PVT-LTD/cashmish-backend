import express from "express";
import { createPickUpDetails, getAllPickUpDetails, getPickUpDetailsById, deletePickUpDetails, updatePickUpDetails } from "../controllers/pickupController.js";

const router = express.Router();
router.post("/", createPickUpDetails);
router.get("/", getAllPickUpDetails);
router.get("/:id", getPickUpDetailsById);
router.put("/:id", updatePickUpDetails);
router.delete("/:id", deletePickUpDetails);

export default router;