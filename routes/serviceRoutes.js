const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const { encryptFileBuffer } = require('../utils/encryption');
const ServiceRequest = require('../models/ServiceRequest');
const FileModel = require('../models/File');

// Ensure vault directory exists for encrypted storage
const vaultDir = path.join(__dirname, '../vault');
if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
}

// 1. Customer Upload Vault Route
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded!' });
        }

        // Encrypt file buffer using AES-256
        const encryptedResult = encryptFileBuffer(req.file.buffer);
        
        const filename = `${Date.now()}_${req.file.originalname}.enc`;
        const encryptedStoragePath = path.join(vaultDir, filename);

        // Write encrypted hex string to disk vault securely
        fs.writeFileSync(encryptedStoragePath, encryptedResult.encryptedData, 'utf8');

        // Generate a 4-digit unique Service PIN
        const servicePIN = Math.floor(1000 + Math.random() * 9000).toString();
        const qrCodeData = `SERVEXA-REQ-${Date.now()}`;

        // Create Service Request record in database
        const newRequest = new ServiceRequest({
            userId: req.body.userId || '65a4b1c2e4b0a123456789ab',
            serviceType: req.body.serviceType || 'Document Printing',
            status: 'Submitted',
            servicePIN: servicePIN,
            qrCodeData: qrCodeData,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours expiry
        });
        await newRequest.save();

        // Create File metadata record
        const fileRecord = new FileModel({
            requestId: newRequest._id,
            originalName: req.file.originalname,
            encryptedStoragePath: encryptedStoragePath,
            encryptionIV: encryptedResult.iv,
            fileSize: req.file.size
        });
        await fileRecord.save();

        res.status(201).json({
            success: true,
            message: 'File uploaded and encrypted securely using AES-256!',
            data: {
                requestId: newRequest._id,
                servicePIN: servicePIN,
                qrCodeData: qrCodeData,
                expiresAt: newRequest.expiresAt
            }
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;