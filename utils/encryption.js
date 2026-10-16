const crypto = require('crypto');

const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'default_secret', 'salt', 32); 
const IV_LENGTH = 16;

const encryptFileBuffer = (buffer) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
};

const decryptFileBuffer = (encryptedHex, ivHex) => {
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    
    return decrypted;
};

module.exports = { encryptFileBuffer, decryptFileBuffer };