const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Submitted', 'Processing', 'Completed', 'Cancelled'], 
    default: 'Submitted' 
  },
  servicePIN: { type: String, required: true },
  qrCodeData: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true } // Used for auto-deletion tracking
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);