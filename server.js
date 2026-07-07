/**
 * 赢日志 - 本地轻量级 Express 数据库及 AI 转发服务 (ES Module 格式)
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'db.json');
const DEFAULT_AI_API_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_AI_MODEL = 'qwen/qwen-3-coder:free';

app.use(cors());
app.use(express.json());

// 托管前端打包后的静态资源 (供服务器单包部署使用)
app.use(express.static(path.join(__dirname, 'dist')));

import crypto from 'crypto';

// 密码加密哈希处理
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createDefaultSettings(overrides = {}) {
  return {
    job: 'frontend',
    tone: 'professional',
    similarityThreshold: 50,
    rollingDays: 7,
    aiApiKey: '',
    aiApiUrl: DEFAULT_AI_API_URL,
    aiModel: DEFAULT_AI_MODEL,
    aiEnabled: false,
    saveKeyToCloud: true,
    ...overrides
  };
}

function buildTaskSeed(userInput, job, mode) {
  const currentMode = mode === 'idle' || mode === 'study' ? mode : 'task';
  const explicitInput = typeof userInput === 'string' ? userInput.trim() : '';

  if (currentMode === 'task' && explicitInput) {
    return `【${explicitInput}】`;
  }

  const presets = job === 'designer'
    ? {
        task: '“设计开发：细化核心页面高保真视觉稿、核对产品线框流程、整理切图交付并走查开发还原效果”',
        idle: '“日常维护：整理历史项目高保真视觉源文件、清理本地 Figma 冗余图层、校对视觉组件规范库”',
        study: '“设计预研：调研移动端 UI/UX 交互趋势、收集优秀商业设计案例、整理个人视觉提案思路”'
      }
    : {
        task: '“业务开发：编写日常模块页面与交互逻辑、配合后端完成数据联调、本地浏览器回归走查”',
        idle: '“日常维护：例行整理代码库细节、排查前端界面样式兼容问题、清理警告日志并本地自测”',
        study: '“技术预研：阅读前端工程化规范指南、在本地环境搭建测试 Demo、整理框架新特性笔记”'
      };

  return presets[currentMode];
}

function isSafetyPlaceholder(rawText) {
  const normalized = rawText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalized) return false;

  return (
    /^(user|assistant)?\s*safety\s*:\s*(safe|unsafe|blocked)\.?$/.test(normalized) ||
    /^(moderation|content\s*safety)\s*:\s*(safe|unsafe|blocked)\.?$/.test(normalized) ||
    /^(safe|unsafe|blocked)\.?$/.test(normalized)
  );
}

// 初始化 db.json (支持多租户升级与历史单用户数据无损自动迁移)
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    return;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    // 如果没有 users 节点，说明是旧版全局单用户结构，执行无损一键迁移
    if (!data.users) {
      console.log('检测到旧版本单用户数据库，正在自动执行无损数据迁移...');
      const migratedLogs = data.logs || {};
      const migratedSettings = data.settings || {
        job: 'frontend',
        tone: 'professional',
        similarityThreshold: 50,
        rollingDays: 7
      };
      
      const upgradedData = {
        users: {
          admin: {
            password: hashPassword('admin123'), // 默认迁移账号为 admin，初始密码 admin123
            logs: migratedLogs,
            settings: migratedSettings
          }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(upgradedData, null, 2), 'utf8');
      console.log('🟢 历史数据成功无损迁移至默认账号: admin (密码: admin123)！');
    }
  } catch (e) {
    console.error('初始化数据库失败，重置为空结构:', e);
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2), 'utf8');
  }
}

// 读取数据
function readDB() {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据库失败:', error);
    return { users: {} };
  }
}

// 写入数据
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入数据库失败:', error);
    return false;
  }
}

// API: 用户注册
app.post('/api/register', (req, res) => {
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
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空！' });
  }

  const db = readDB();
  const normalizedUser = username.trim().toLowerCase();
  const user = db.users[normalizedUser];

  if (!user || user.password !== hashPassword(password)) {
    return res.status(400).json({ error: '用户名或密码错误，请核对后重试！' });
  }

  res.json({
    success: true,
    username: normalizedUser,
    settings: user.settings
  });
});

// API: 获取该特定用户的所有日志与配置
app.get('/api/data', (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const db = readDB();
  
  if (!db.users[username]) {
    // 兼容可能漏掉的默认用户
    db.users[username] = {
      password: hashPassword('admin123'),
      logs: {},
      settings: createDefaultSettings({ aiEnabled: true })
    };
    writeDB(db);
  }

  res.json({
    logs: db.users[username].logs || {},
    settings: db.users[username].settings || {}
  });
});

// API: 保存单条日志 (支持用户维度写入)
app.post('/api/logs', (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const { date, title, hours, cooperation, difficulty, content, job, tone, isAutoGenerated } = req.body;
  if (!date || !content) {
    return res.status(400).json({ error: '缺少 date 或 content 参数' });
  }

  const db = readDB();
  if (!db.users[username]) {
    return res.status(401).json({ error: '当前用户未登录或登录态失效，请重新登录！' });
  }

  db.users[username].logs[date] = {
    title: title || '日常工作日志',
    hours: hours !== undefined ? Number(hours) : 8,
    cooperation: !!cooperation,
    difficulty: !!difficulty,
    content,
    job,
    tone,
    isAutoGenerated,
    updatedAt: new Date().toISOString()
  };

  if (writeDB(db)) {
    res.json({ success: true, log: db.users[username].logs[date] });
  } else {
    res.status(500).json({ error: '保存日志失败' });
  }
});

// API: 删除单条日志 (支持用户维度删除)
app.delete('/api/logs/:date', (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const { date } = req.params;
  const db = readDB();

  if (db.users[username] && db.users[username].logs[date]) {
    delete db.users[username].logs[date];
    if (writeDB(db)) {
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: '日志不存在或删除失败' });
});

// API: 保存用户配置
app.post('/api/settings', (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const { job, tone, similarityThreshold, rollingDays, customTemplates, aiApiKey, aiApiUrl, aiModel, aiEnabled, saveKeyToCloud } = req.body;
  const db = readDB();

  if (!db.users[username]) {
    return res.status(401).json({ error: '当前用户未登录或失效！' });
  }

  db.users[username].settings = {
    ...db.users[username].settings,
    job: job || db.users[username].settings.job,
    tone: tone || db.users[username].settings.tone,
    similarityThreshold: similarityThreshold !== undefined ? similarityThreshold : db.users[username].settings.similarityThreshold,
    rollingDays: rollingDays !== undefined ? Number(rollingDays) : db.users[username].settings.rollingDays || 7,
    customTemplates: customTemplates || db.users[username].settings.customTemplates,
    aiApiKey: aiApiKey !== undefined ? aiApiKey : db.users[username].settings.aiApiKey,
    aiApiUrl: aiApiUrl !== undefined ? aiApiUrl : db.users[username].settings.aiApiUrl,
    aiModel: aiModel !== undefined ? aiModel : db.users[username].settings.aiModel,
    aiEnabled: aiEnabled !== undefined ? !!aiEnabled : db.users[username].settings.aiEnabled,
    saveKeyToCloud: saveKeyToCloud !== undefined ? !!saveKeyToCloud : db.users[username].settings.saveKeyToCloud
  };

  if (writeDB(db)) {
    res.json({ success: true, settings: db.users[username].settings });
  } else {
    res.status(500).json({ error: '保存配置失败' });
  }
});

// API: 恢复出厂设置 (支持单用户维度重置)
app.post('/api/reset', (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const db = readDB();

  if (db.users[username]) {
    db.users[username].logs = {};
    db.users[username].settings = createDefaultSettings();
    if (writeDB(db)) {
      return res.json({ success: true });
    }
  }
  res.status(500).json({ error: '重置数据库失败' });
});

// API: 在线调用 AI 生成日报 (多用户 Key 隔离中转代理模式，后端零留存)
app.post('/api/generate', async (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const { userInput, job, mode, aiApiKey, aiApiUrl, aiModel } = req.body;

  const db = readDB();
  const user = db.users[username] || { settings: {} };

  const finalApiKey = aiApiKey || user.settings.aiApiKey;
  const finalApiUrl = aiApiUrl || user.settings.aiApiUrl || DEFAULT_AI_API_URL;
  const finalApiModel = aiModel || user.settings.aiModel || DEFAULT_AI_MODEL;

  if (!finalApiKey) {
    return res.status(400).json({ error: '在线大模型接口未配置 API 密钥 (API Key)！请先前往设置或首页申请配置。' });
  }

  const jobName = job === 'designer' ? 'UI/UX 视觉设计师' : '前端开发工程师';
  const tasksText = buildTaskSeed(userInput, job, mode);

  const examples = job === 'designer' ? `
* 不推荐（太虚太浮夸）：
“针对产品核心展示模块进行了全方位的交互体验设计与视觉包装升级，构建了高复用的视觉规范，显著提升了页面在跨终端环境下的用户体感和开发对接效率。”
* 推荐（写实自然）：
“跟产品对了对下期需求的线框图，理了理几个复杂的页面跳转逻辑。下午把这期核心的高保真视觉设计稿细化了下，顺便把本地图层重新命名归档整理了下，给云盘腾了腾空间。”
` : `
* 不推荐（太虚太浮夸）：
“深度重构了系统核心列表渲染组件，引入了基于虚拟滚动的高效异步加载算法，成功缩减了打包体积，显著优化了页面在低端机型下的首屏交互流畅度。”
* 推荐（写实自然）：
“把首页列表数据多的时候有点卡顿的问题给优化了下，改成了按需懒加载渲染。顺手把项目打包的配置文件精简了下，清理了几个过期不用的包，在本地跑了下回归测试。”
`;

  const systemPrompt = `你是一个专业 ${jobName}，擅长把当天真实工作记录整理成平实、简洁的公司内部日报。`;
  const userPrompt = `请把下面这段今日工作记录整理成一份日常工作日志。

今日工作记录：${tasksText}

要求：
1. 语气口语化、平实写实，像当天工作复盘；不要写夸张成果，不要编造数据、奖项或上线影响。
2. 可以在给定工作范围内补充合理执行步骤，比如核对、调整、联调、自测、整理记录等。
3. 总字数控制在 100 - 150 字之间，分 2-3 条列出。
4. 每一条工作内容保持 20 到 35 个字左右，句子要完整，有动作、步骤或自测细节。
5. 顺便帮我起一个 15 字以内的极简日志标题。

请参考并对比以下写作风格：
${examples}

请严格按照以下格式直接输出（不要有任何多余的 Markdown 代码块或前后缀解释说明）：
标题：[极简日志标题]
内容：
1. [第一条工作内容，大白话口语，写实有细节]
2. [第二条工作内容，大白话口语，写实有细节]`;

  try {
    const apiBaseUrl = finalApiUrl || 'https://openrouter.ai/api/v1';
    const apiUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl + 'chat/completions' : apiBaseUrl + '/chat/completions';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`
      },
      body: JSON.stringify({
        model: finalApiModel || DEFAULT_AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 平台响应错误: ${response.status} - ${errText}`);
    }

    const apiData = await response.json();

    if (!apiData.choices || apiData.choices.length === 0 || !apiData.choices[0].message) {
      throw new Error('API 平台返回了空响应，请切换其他免费推荐大模型或稍后重试！');
    }

    const contentVal = apiData.choices[0].message.content;
    if (contentVal === null || contentVal === undefined) {
      throw new Error('大模型内容被平台过滤或响应为空，请换个模型重新尝试！');
    }

    const rawText = contentVal.trim();
    
    // 拦截上游安全过滤器返回的无效占位文本，例如 "User Safety: safe"。
    if (isSafetyPlaceholder(rawText)) {
      throw new Error('上游安全内容拦截: 大模型返回了安全审核占位词，请在左下角切换为其他大模型（如 Qwen3 或 Llama）重新尝试！');
    }

    if (rawText.length < 15) {
      throw new Error('API 平台返回内容过短，未形成可用日报，请稍后重试或切换其他模型。');
    }

    // 解析
    let title = '日常开发工作';
    let content = rawText;

    const titleMatch = rawText.match(/标题：\s*(.+)/);
    const contentMatch = rawText.match(/内容：\s*([\s\S]+)/);

    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    if (contentMatch && contentMatch[1]) {
      content = contentMatch[1].trim();
    }

    res.json({ success: true, title, content });
  } catch (error) {
    console.error('在线 AI 生成请求失败:', error);
    res.status(500).json({ error: error.message || '大模型生成请求失败' });
  }
});

// API: 动态拉取并同步大模型列表 (中转转发 /v1/models)
app.post('/api/models', async (req, res) => {
  const username = (req.headers['x-user-name'] || 'admin').trim().toLowerCase();
  const { aiApiKey, aiApiUrl } = req.body;

  const db = readDB();
  const user = db.users[username] || { settings: {} };

  const finalApiKey = aiApiKey || user.settings.aiApiKey;
  const finalApiUrl = aiApiUrl || user.settings.aiApiUrl || 'https://openrouter.ai/api/v1';

  if (!finalApiKey) {
    return res.status(400).json({ error: '请先填入 API 密钥以获取模型列表！' });
  }

  try {
    const apiBaseUrl = finalApiUrl || 'https://openrouter.ai/api/v1';
    const modelsUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl + 'models' : apiBaseUrl + '/models';

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${finalApiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`获取模型列表失败: ${response.status}`);
    }

    const apiData = await response.json();
    
    // 清洗模型数据，标记免费模型
    const models = (apiData.data || []).map(m => {
      let isFree = false;
      if (m.id.includes(':free') || m.id.includes('-free')) {
        isFree = true;
      }
      if (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0) {
        isFree = true;
      }
      
      return {
        id: m.id,
        name: m.name || m.id,
        isFree
      };
    });

    res.json({ success: true, models });
  } catch (error) {
    console.error('获取大模型列表失败:', error);
    res.status(500).json({ error: error.message || '拉取大模型列表失败' });
  }
});

// 前端路由通配托管 (支持 React 路由 SPA 刷新不报 404)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend Database Server is running on http://localhost:${PORT}`);
});
