import { readDB } from '../db.js';
import { verifyAuthToken } from '../utils/password.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const tokenHeader = req.headers['x-auth-token'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenHeader.trim();

  if (!token) {
    return res.status(401).json({ error: '缺少登录凭证，请重新登录。' });
  }

  const resolvedUser = verifyAuthToken(token);
  if (!resolvedUser) {
    return res.status(401).json({ error: '登录凭证已过期或签名无效，请重新登录。' });
  }

  const db = readDB();
  if (!db.users[resolvedUser]) {
    return res.status(401).json({ error: '用户账户不存在，请重新登录。' });
  }

  req.username = resolvedUser;
  next();
}
