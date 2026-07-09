import { readDB } from '../db.js';

export function authMiddleware(req, res, next) {
  const username = (req.headers['x-user-name'] || '').trim().toLowerCase();
  if (!username) {
    return res.status(401).json({ error: '缺少用户身份标识，请重新登录。' });
  }
  const db = readDB();
  if (!db.users[username]) {
    return res.status(401).json({ error: '用户不存在，请重新登录。' });
  }
  req.username = username;
  next();
}
