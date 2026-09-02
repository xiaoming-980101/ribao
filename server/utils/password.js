import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BCRYPT_ROUNDS, TOKEN_SECRET } from '../config.js';

export function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password, storedHash) {
  if (storedHash.length > 64 || storedHash.startsWith('$2')) {
    return bcrypt.compareSync(password, storedHash);
  }
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  if (sha256Hash === storedHash) {
    return 'needs_upgrade';
  }
  return false;
}

export function generateAuthToken(username) {
  const payload = {
    u: username.toLowerCase().trim(),
    t: Date.now()
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');
  return `${payloadBase64}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadBase64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadBase64).digest('hex');
  if (signature !== expectedSig) return null;

  try {
    const raw = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(raw);
    if (!payload || !payload.u || !payload.t) return null;
    // 30 天有效期
    const maxAge = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.t > maxAge) return null;
    return payload.u;
  } catch (e) {
    return null;
  }
}
