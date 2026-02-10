import express from 'express';
import { getPriceConfig, updatePriceConfig } from '../controllers/priceConfigController.js';

const router = express.Router();

router.get('/', getPriceConfig);
router.put('/', updatePriceConfig);

export default router;
