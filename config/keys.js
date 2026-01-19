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
    port: process.env.PORT || 5000,
}