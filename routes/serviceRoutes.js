const express = require('express');  
const router = express.Router();  
const fs = require('fs');  
const path = require('path');  
const upload = require('../middleware/upload');  
const { encryptFileBuffer } = require('../utils/encryption');  
const ServiceRequest = require('../models/ServiceRequest');  
const FileModel = require('../models/File');  

// Vault directory setup
const vaultDir = path.join(__dirname, '../vault');  
if (!fs.existsSync(vaultDir)) {  
 fs.mkdirSync(vaultDir, { recursive: true });  
}  

// Customer Upload Route  
router.post('/upload', upload.single('file'), async (req, res) => {  
 try {  
  if (!req.file) {  
   return res.status(400).json({ success: false, message: 'No file uploaded!' });  
  }  

  // Encrypt file buffer using AES-256  
  const encryptedResult = encryptFileBuffer(req.file.buffer);  
   
  const filename = `${Date.now()}_${req.file.originalname}.enc`;  
  const diskPath = path.join(vaultDir, filename);  

  // Disk par save karein
  fs.writeFileSync(diskPath, encryptedResult.encryptedData, 'utf8');  

  // Generate 4-digit PIN & QR Code data
  const servicePIN = Math.floor(1000 + Math.random() * 9000).toString();  
  const qrCodeData = `SERVEXA-REQ-${Date.now()}`;  

  // Service Request entry
  const newRequest = new ServiceRequest({  
   userId: req.body.userId, // Authenticated User ID pass karein
   serviceType: req.body.serviceType || 'Document Printing',  
   status: 'Submitted',  
   servicePIN: servicePIN,  
   qrCodeData: qrCodeData,  
   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)  
  });  
  await newRequest.save();  

  // File Metadata entry (Only save relative path or filename)
  const fileRecord = new FileModel({  
   requestId: newRequest._id,  
   originalName: req.file.originalname,  
   encryptedStoragePath: filename, // Save only filename for portability
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