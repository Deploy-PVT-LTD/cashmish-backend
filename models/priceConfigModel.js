import mongoose from 'mongoose';

const priceConfigSchema = new mongoose.Schema({
    screen: {
        perfect: { type: Number, default: 0 },
        scratched: { type: Number, default: 10 },
        cracked: { type: Number, default: 25 }
    },
    body: {
        perfect: { type: Number, default: 0 },
        scratched: { type: Number, default: 10 },
        damaged: { type: Number, default: 20 }
    },
    battery: {
        good: { type: Number, default: 0 },
        average: { type: Number, default: 10 },
        poor: { type: Number, default: 20 }
    }
}, { timestamps: true });

export const PriceConfig = mongoose.model('PriceConfig', priceConfigSchema);
