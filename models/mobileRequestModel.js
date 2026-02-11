import mongoose from 'mongoose';

const mobileRequestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE'],
        required: true
    },
    data: {
        type: Object, // Stores the payload for CREATE/UPDATE
        required: true
    },
    mobileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mobile',
        required: function () { return this.type !== 'CREATE'; }
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    rejectionReason: {
        type: String
    }
}, { timestamps: true });

export const MobileRequest = mongoose.model('MobileRequest', mobileRequestSchema);
