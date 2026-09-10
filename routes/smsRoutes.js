import express from "express";
import { handleTelnyxWebhook } from "../controllers/smsController.js";

const router = express.Router();

// Telnyx calls this for inbound SMS replies (e.g. STOP) and delivery status updates
router.post("/webhook", handleTelnyxWebhook);

export default router;
