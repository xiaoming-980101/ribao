import express from 'express';
import cors from 'cors';
import path from 'path';
import { PORT, DIST_PATH } from './config.js';
import { initDB } from './db.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import aiRoutes from './routes/ai.js';

const app = express();

// 初始化数据库
initDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 托管前端打包后的静态资源 (供服务器单包部署使用)
app.use(express.static(DIST_PATH));

// 注册路由
app.use('/api', authRoutes);
app.use('/api', dataRoutes);
app.use('/api', aiRoutes);

// 前端路由通配托管 (支持 React 路由 SPA 刷新不报 404)
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// 全局错误处理中间件 (统一 JSON 格式返回，生产加固)
app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(err.statusCode || 500).json({
    error: err.message || '服务器内部异常，请稍后再试。',
    routeInfo: err.routeInfo
  });
});

// 捕获未处理的进程级异常
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] 捕获到未处理的同步异常:', err.stack || err);
  // 本地服务暂不强制退出
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[unhandledRejection] 捕获到未处理的 Promise 拒绝:', reason);
});

app.listen(PORT, () => {
  console.log(`Backend Database Server is running on http://localhost:${PORT}`);
});

export default app;
