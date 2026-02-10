import mongoose from "mongoose";

const mobileSchema = new mongoose.Schema({
    brand: {
        type: String,
        enum: ['Apple', 'Samsung'],
        required: true
    },
    phoneModel: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deductionRules: {
        screen: {
            perfect: { type: Number },
            scratched: { type: Number },
            cracked: { type: Number }
        },
        body: {
            perfect: { type: Number },
            scratched: { type: Number },
            damaged: { type: Number }
        },
        battery: {
            good: { type: Number },
            average: { type: Number },
            poor: { type: Number }
        }
    }
}, { timestamps: true })

export const Mobile = mongoose.model('Mobile', mobileSchema);