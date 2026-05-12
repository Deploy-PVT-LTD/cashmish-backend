import express from 'express';
import { getTrafficStats, getTrafficHistory, pingVisitor } from '../controllers/trafficController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Public ping endpoint — called by the frontend on page load to register a visit
// The trackTraffic middleware handles the actual recording + deduplication
router.get('/ping', pingVisitor);

// Only admins should be able to see traffic stats
router.get('/stats', auth, getTrafficStats);
router.get('/history', auth, getTrafficHistory);

export default router;
