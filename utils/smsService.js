import keys from '../config/keys.js';
import { SmsOptOut } from '../models/smsOptOutModel.js';

const TELNYX_API_URL = 'https://api.telnyx.com/v2/messages';

// ✅ Verify presence of API Key on startup
if (!keys.telnyxApiKey) {
  console.error("❌ TELNYX ERROR: API Key is missing in .env");
} else {
  console.log("✅ TELNYX INITIALIZED — SMS will be sent from", keys.telnyxFromNumber);
}

// Normalize phone numbers to E.164 format (+1XXXXXXXXXX) for US numbers
const toE164 = (phone) => {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (trimmed.startsWith('+')) return trimmed;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null; // not a recognizable US number
};

export const sendSMS = async ({ phone, message }) => {
  const to = toE164(phone);

  if (!to) {
    console.error(`[TELNYX] Invalid or missing phone number: "${phone}" — SMS skipped.`);
    return { success: false, error: 'Invalid phone number' };
  }

  // Respect opt-outs (customers who replied STOP)
  try {
    const optedOut = await SmsOptOut.findOne({ phoneNumber: to });
    if (optedOut) {
      console.log(`[TELNYX] ${to} has opted out — SMS skipped.`);
      return { success: false, skipped: true, reason: 'opted_out' };
    }
  } catch (err) {
    console.error('[TELNYX] Opt-out lookup failed, sending anyway:', err.message);
  }

  console.log(`[TELNYX] Attempting to send SMS to: ${to}`);

  try {
    const response = await fetch(TELNYX_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keys.telnyxApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: keys.telnyxFromNumber,
        to,
        text: message,
        messaging_profile_id: keys.telnyxMessagingProfileId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[TELNYX] API Error:', data.errors || data);
      throw new Error(data.errors?.[0]?.detail || 'Failed to send SMS');
    }

    console.log(`[TELNYX] SMS sent successfully! ID: ${data.data.id}`);
    return { success: true, id: data.data.id };
  } catch (err) {
    console.error('[TELNYX] Execution Error:', err.message);
    return { success: false, error: err.message };
  }
};

// ---------------------------------------------------------------------
// SMS Templates — plain text, kept short (single segment where possible)
// Mirrors the email templates in emailService.js so every email trigger
// has a matching SMS trigger.
// ---------------------------------------------------------------------

export const getFormConfirmationSMS = (userName, deviceName, estimatedPrice) =>
  `Hi ${userName}, CashMish received your request for ${deviceName}. Estimated offer: $${estimatedPrice}. We'll be in touch soon! Reply STOP to opt out.`;

export const getAdminBidOfferSMS = (userName, deviceName, bidPrice) =>
  `Hi ${userName}, CashMish has a new offer for your ${deviceName}: $${bidPrice}. Log in to accept or reject it. Reply STOP to opt out.`;

export const getAcceptPriceSMS = (userName, deviceName, price) =>
  `Hi ${userName}, your $${price} offer for ${deviceName} has been accepted! We'll contact you shortly to arrange pickup. - CashMish`;

export const getBidStatusRejectedSMS = (userName, deviceName) =>
  `Hi ${userName}, unfortunately we couldn't proceed with your ${deviceName} trade-in request. Contact support if you have questions. - CashMish`;

export const getPayoutSentSMS = (userName, amount) =>
  `Hi ${userName}, your CashMish payment of $${amount} has been sent! It may take a few days to reflect in your account. Thank you!`;
