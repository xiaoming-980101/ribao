import { readDB } from '../db.js';
import { verifyAuthToken } from '../utils/password.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const tokenHeader = req.headers['x-auth-token'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : tokenHeader.trim();
  const rawUsername = (req.headers['x-user-name'] || '').trim().toLowerCase();

  let resolvedUser = null;

  if (token) {
    resolvedUser = verifyAuthToken(token);
    if (!resolvedUser) {
      return res.status(401).json({ error: '登录凭证已过期或签名无效，请重新登录。' });
    }
  } else if (rawUsername) {
    // 兼容离线或旧客户端过渡调用
    resolvedUser = rawUsername;
  }

  if (!resolvedUser) {
    return res.status(401).json({ error: '缺少用户身份鉴权凭据，请重新登录。' });
  }

  const db = readDB();
  if (!db.users[resolvedUser]) {
    return res.status(401).json({ error: '用户账户不存在，请重新登录。' });
  }

  req.username = resolvedUser;
  next();
}
