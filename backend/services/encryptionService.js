const crypto = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(config.encryptionKey, 'hex'); // Must be 32 bytes for aes-256
const IV = Buffer.from(config.encryptionIV, 'hex');   // Must be 16 bytes for aes-256-cbc

if (KEY.length !== 32) {
    logger.error('Encryption key must be 32 bytes (64 hex characters). Current length:', KEY.length);
    // process.exit(1); // Or handle more gracefully
}
if (IV.length !== 16) {
    logger.error('Encryption IV must be 16 bytes (32 hex characters). Current length:', IV.length);
    // process.exit(1); // Or handle more gracefully
}

const encrypt = (text) => {
    if (!text) return null;
    try {
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
        let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (error) {
        logger.error('Encryption failed:', error);
        return null; 
    }
};

const decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        logger.error('Decryption failed:', error);
        return null;
    }
};

module.exports = { encrypt, decrypt };