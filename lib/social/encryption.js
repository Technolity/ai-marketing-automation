/**
 * Token Encryption — AES-256-CBC
 *
 * Encrypts/decrypts Buffer OAuth access tokens before storing in the database.
 *
 * Requires env var:
 *   ENCRYPTION_KEY  — 32-byte key encoded as base64
 *   Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (base64-encoded).');
  return key;
}

/**
 * Encrypts a plaintext token.
 * @param {string} token - Plaintext access token
 * @returns {string} "{ivHex}:{encryptedHex}"
 */
export function encryptToken(token) {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a token stored in the database.
 * @param {string} encryptedToken - "{ivHex}:{encryptedHex}"
 * @returns {string} Plaintext access token
 */
export function decryptToken(encryptedToken) {
  const key = getKey();
  const [ivHex, encryptedHex] = encryptedToken.split(':');
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted token format.');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
