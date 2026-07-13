const crypto = require('crypto');

// Raw value goes to the user (email link / cookie); only the hash is stored,
// same pattern used for OTPToken and Session documents.
const generateRawToken = () => crypto.randomBytes(32).toString('hex');

const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = { generateRawToken, hashToken };
