import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BCRYPT_ROUNDS } from '../config.js';

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
