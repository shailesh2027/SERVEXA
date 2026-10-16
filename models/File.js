const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  originalName: { type: String, required: true },
  encryptedStoragePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  encryptionIV: { type: String, required: true }, // AES-256 IV required for decryption
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);