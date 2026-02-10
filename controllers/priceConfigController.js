import { PriceConfig } from '../models/priceConfigModel.js';

// Get current price configuration (or create default if not exists)
export const getPriceConfig = async (req, res) => {
    try {
        let config = await PriceConfig.findOne();
        if (!config) {
            config = await PriceConfig.create({});
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching price configuration' });
    }
};

// Update price configuration
export const updatePriceConfig = async (req, res) => {
    try {
        let config = await PriceConfig.findOne();
        if (!config) {
            config = new PriceConfig(req.body);
        } else {
            // Update fields
            if (req.body.screen) config.screen = { ...config.screen, ...req.body.screen };
            if (req.body.body) config.body = { ...config.body, ...req.body.body };
            if (req.body.battery) config.battery = { ...config.battery, ...req.body.battery };
        }
        await config.save();
        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error updating price configuration' });
    }
};
