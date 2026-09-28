// 4-digit jam-proof PIN generator
const crypto = require('crypto');

/**
 * Generates a secure random 4-digit numeric string (1000 - 9999)
 */
exports.generateVerificationPin = () => {
  return crypto.randomInt(1000, 10000).toString();
};