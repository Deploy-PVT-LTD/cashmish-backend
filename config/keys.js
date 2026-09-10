import dotenv from 'dotenv';
import setupDNS from './dns.js';
setupDNS();
dotenv.config();

export default {
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackURL: process.env.GOOGLE_CALLBACK_URL,
    resendApiKey: process.env.RESEND_API_KEY,
    emailFrom: process.env.EMAIL_FROM || 'support@cashmish.com',
    telnyxApiKey: process.env.TELNYX_API_KEY,
    telnyxFromNumber: process.env.TELNYX_FROM_NUMBER,
    telnyxMessagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID,
    port: process.env.PORT || 5000,
}