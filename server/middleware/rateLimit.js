import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: '请求过于频繁，请 15 分钟后再试。' },
  standardHeaders: true,
  legacyHeaders: false
});
