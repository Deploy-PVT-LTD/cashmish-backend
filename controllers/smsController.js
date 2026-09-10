import { SmsOptOut } from "../models/smsOptOutModel.js";

const STOP_KEYWORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
const START_KEYWORDS = ["START", "YES", "UNSTOP"];

// Telnyx hits this route for inbound SMS and delivery status updates.
// Docs: https://developers.telnyx.com/docs/messaging/messages/receive-a-message
export const handleTelnyxWebhook = async (req, res) => {
  try {
    const event = req.body?.data;

    // Always acknowledge quickly — Telnyx retries if it doesn't get a 200.
    res.sendStatus(200);

    if (!event) return;

    const eventType = event.event_type;

    if (eventType === "message.received") {
      const from = event.payload?.from?.phone_number;
      const text = (event.payload?.text || "").trim().toUpperCase();

      if (!from) return;

      if (STOP_KEYWORDS.includes(text)) {
        await SmsOptOut.findOneAndUpdate(
          { phoneNumber: from },
          { phoneNumber: from, reason: text },
          { upsert: true, new: true }
        );
        console.log(`[TELNYX WEBHOOK] ${from} opted out (${text}).`);
      } else if (START_KEYWORDS.includes(text)) {
        await SmsOptOut.deleteOne({ phoneNumber: from });
        console.log(`[TELNYX WEBHOOK] ${from} opted back in (${text}).`);
      } else {
        console.log(`[TELNYX WEBHOOK] Inbound message from ${from}: "${event.payload?.text}"`);
      }
    } else if (eventType?.startsWith("message.")) {
      // e.g. message.sent, message.finalized, message.delivery_updated
      const id = event.payload?.id;
      const status = event.payload?.to?.[0]?.status;
      console.log(`[TELNYX WEBHOOK] ${eventType} — id: ${id}, status: ${status}`);
    }
  } catch (err) {
    console.error("[TELNYX WEBHOOK] Error handling webhook:", err.message);
    // Response already sent above; nothing more to do.
  }
};
