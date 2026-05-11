import express from 'express';
import { getTrafficStats, getTrafficHistory } from '../controllers/trafficController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// Only admins should be able to see traffic stats
router.get('/stats', auth, getTrafficStats);
router.get('/history', auth, getTrafficHistory);

export default router;
