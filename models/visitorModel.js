import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  region: {
    type: String,
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String
  },
  path: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create a compound index to help with counting unique visitors per day if needed
visitorSchema.index({ ip: 1, timestamp: -1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

export default Visitor;
