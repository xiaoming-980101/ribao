import express from 'express';
import { readDB, writeDB, createDefaultSettings, upgradePasswordHash } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// API: 用户注册
router.post('/register', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空！' });
  }

  const db = readDB();
  const normalizedUser = username.trim().toLowerCase();

  if (db.users[normalizedUser]) {
    return res.status(400).json({ error: '该用户名已存在，请换一个重试！' });
  }

  db.users[normalizedUser] = {
    password: hashPassword(password),
    logs: {},
    settings: createDefaultSettings()
  };

  if (writeDB(db)) {
    res.json({ success: true, message: '注册成功！' });
  } else {
    res.status(500).json({ error: '写入数据失败' });
  }
});

// API: 用户登录
router.post('/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空！' });
  }

  const db = readDB();
  const normalizedUser = username.trim().toLowerCase();
  const user = db.users[normalizedUser];

  if (!user) {
    return res.status(400).json({ error: '用户名或密码错误，请核对后重试！' });
  }

  const verifyResult = verifyPassword(password, user.password);
  if (!verifyResult) {
    return res.status(400).json({ error: '用户名或密码错误，请核对后重试！' });
  }

  if (verifyResult === 'needs_upgrade') {
    upgradePasswordHash(normalizedUser, password);
  }

  res.json({
    success: true,
    username: normalizedUser,
    settings: user.settings
  });
});

export default router;
