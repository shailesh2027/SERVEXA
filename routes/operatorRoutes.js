const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const ServiceRequest = require('../models/ServiceRequest');
const FileModel = require('../models/File');
const { decryptFileBuffer } = require('../utils/encryption');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// 0. Operator Login Route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === process.env.OPERATOR_USER && password === process.env.OPERATOR_PASS) {
            const token = jwt.sign({ role: 'operator', username }, JWT_SECRET, { expiresIn: '2h' });
            return res.status(200).json({ success: true, token, message: 'Login successful!' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid operator credentials!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 1. Get all pending requests for operator queue
router.get('/queue', async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ status: { $ne: 'Completed' } }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Verify Service PIN and View/Print Document Securely
router.post('/verify-pin', async (req, res) => {
    try {
        const { requestId, enteredPIN } = req.body;

        const request = await ServiceRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Service request not found!' });
        }

        if (request.servicePIN !== enteredPIN) {
            return res.status(400).json({ success: false, message: 'Invalid Service PIN entered by operator!' });
        }

        const fileRecord = await FileModel.findOne({ requestId: request._id });
        if (!fileRecord) {
            return res.status(404).json({ success: false, message: 'Associated file record not found!' });
        }

        const fileName = path.basename(fileRecord.encryptedStoragePath);
        const possiblePaths = [
            fileRecord.encryptedStoragePath,
            path.join(process.cwd(), fileRecord.encryptedStoragePath),
            path.join(process.cwd(), 'vault', fileName),
            path.join(__dirname, '../vault', fileName)
        ];

        let fullFilePath = possiblePaths.find(p => fs.existsSync(p));

        if (!fullFilePath || !fs.existsSync(fullFilePath)) {
            return res.status(404).json({ success: false, message: 'Encrypted file missing from vault storage!' });
        }

        const encryptedHex = fs.readFileSync(fullFilePath, 'utf8').trim();
        const decryptedBuffer = decryptFileBuffer(encryptedHex, fileRecord.encryptionIV);

        request.status = 'Processing';
        await request.save();

        res.status(200).json({
            success: true,
            message: 'PIN verified successfully! Document loaded for remote printing.',
            fileName: fileRecord.originalName,
            fileData: decryptedBuffer.toString('base64'),
            mimeType: fileRecord.originalName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
        });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Mark Request as Completed & Trigger Permanent Purge
router.post('/complete/:id', async (req, res) => {
    try {
        const request = await ServiceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found!' });
        }

        const fileRecord = await FileModel.findOne({ requestId: request._id });
        if (fileRecord) {
            const fileName = path.basename(fileRecord.encryptedStoragePath);
            const possiblePaths = [
                fileRecord.encryptedStoragePath,
                path.join(process.cwd(), fileRecord.encryptedStoragePath),
                path.join(process.cwd(), 'vault', fileName),
                path.join(__dirname, '../vault', fileName)
            ];
            const fullFilePath = possiblePaths.find(p => fs.existsSync(p));

            if (fullFilePath && fs.existsSync(fullFilePath)) {
                fs.unlinkSync(fullFilePath); 
            }
            await FileModel.deleteOne({ _id: fileRecord._id });
        }

        request.status = 'Completed';
        await request.save();

        res.status(200).json({ 
            success: true, 
            message: 'Job completed successfully! Encrypted files and logs permanently purged.' 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
