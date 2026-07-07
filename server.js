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
const DEFAULT_AI_MODEL = 'openrouter/free';
const LEGACY_INVALID_MODELS = new Set([
  'qwen/qwen-3-coder:free'
]);

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
    customJobName: '',
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

function getJobDisplayName(job, customJobName = '') {
  if (job === 'designer') return 'UI/UX 视觉设计师';
  if (job === 'tester') return '测试工程师';
  if (job === 'custom') return String(customJobName || '').trim() || '自定义岗位';
  return '前端开发工程师';
}

function isOpenRouterApiUrl(aiApiUrl = DEFAULT_AI_API_URL) {
  return String(aiApiUrl || '').toLowerCase().includes('openrouter.ai');
}

function normalizeModelId(modelId, aiApiUrl = DEFAULT_AI_API_URL) {
  const isOpenRouterApi = isOpenRouterApiUrl(aiApiUrl);
  if (!isOpenRouterApi && modelId === DEFAULT_AI_MODEL) return '';
  if (LEGACY_INVALID_MODELS.has(modelId)) return isOpenRouterApi ? DEFAULT_AI_MODEL : '';
  return modelId;
}

function buildTaskSeed(userInput, job, mode, customJobName = '') {
  const currentMode = mode === 'idle' || mode === 'study' ? mode : 'task';
  const explicitInput = typeof userInput === 'string' ? userInput.trim() : '';

  if (currentMode === 'task' && explicitInput) {
    return `【${explicitInput}】`;
  }

  const jobName = getJobDisplayName(job, customJobName);
  const presets = job === 'designer'
    ? {
        task: '“设计开发：细化核心页面高保真视觉稿、核对产品线框流程、整理切图交付并走查开发还原效果”',
        idle: '“日常维护：整理历史项目高保真视觉源文件，清理本地 Figma 冗余图层和过期切图，核对组件间距、字号和颜色标注，并把常用素材重新归档”',
        study: '“设计预研：调研移动端 UI/UX 交互趋势，收集优秀商业设计案例，拆解几个常见页面的信息层级和动效细节，整理个人视觉提案思路”'
      }
    : (job === 'tester'
      ? {
          task: '“测试验证：执行提测功能用例、复测历史缺陷、补充异常场景和复现步骤，并整理回归测试结果”',
          idle: '“日常维护：整理回归测试清单，清理测试环境脏数据，复查历史缺陷状态，并抽查几个核心流程的稳定性”',
          study: '“测试预研：学习测试用例设计和自动化脚本稳定性优化，整理边界值、异常分支和兼容性检查点”'
        }
      : (job === 'custom'
        ? {
            task: `“${jobName}：推进当天事项处理，核对关键细节，整理过程记录，并确认后续需要跟进的问题”`,
            idle: `“${jobName}日常维护：整理近期资料和记录，检查已完成事项的后续状态，补齐遗漏信息并归档常用材料”`,
            study: `“${jobName}学习复盘：阅读岗位相关方法资料，复盘近期事项处理过程，整理可复用的检查清单和改进点”`
          }
        : {
        task: '“业务开发：编写日常模块页面与交互逻辑、配合后端完成数据联调、本地浏览器回归走查”',
        idle: '“日常维护：检查历史页面在不同宽度下的样式兼容和交互细节，清理控制台警告、无用日志和本地配置项，顺手梳理公共组件入参，并跑一遍常用页面回归自测”',
        study: '“技术预研：阅读前端工程化规范指南，在本地环境搭建测试 Demo，验证构建配置和组件写法差异，整理框架新特性笔记”'
      }));

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

function findModelIdInText(text = '') {
  const matches = [...String(text).matchAll(/\b([a-z0-9_-]+\/[a-z0-9][a-z0-9_.:+-]*(?::free)?)\b/gi)]
    .map(match => match[1])
    .filter(modelId => !modelId.split('/')[0].includes('.'));

  return matches[0] || '';
}

function normalizeRetryAfter(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.ceil(parsed) : undefined;
}

function extractRouteInfoFromApiData(apiData, requestedModel) {
  const actualModel =
    findModelIdInText(apiData?.model) ||
    findModelIdInText(apiData?.model_id) ||
    findModelIdInText(apiData?.choices?.[0]?.model) ||
    findModelIdInText(apiData?.choices?.[0]?.message?.model) ||
    findModelIdInText(JSON.stringify(apiData || {})) ||
    requestedModel;

  const providerName =
    apiData?.provider_name ||
    apiData?.provider?.name ||
    apiData?.provider ||
    apiData?.metadata?.provider_name ||
    apiData?.choices?.[0]?.provider_name ||
    '';

  return {
    requestedModel,
    actualModel,
    providerName,
    isAutoRoute: requestedModel === 'openrouter/free'
  };
}

function extractRouteInfoFromErrorData(errorData, requestedModel, retryAfterHeader) {
  const errorObj = errorData?.error || errorData || {};
  const metadata = errorObj?.metadata || errorData?.metadata || {};
  const rawText = [
    metadata.raw,
    metadata.message,
    errorObj.message,
    typeof errorData === 'string' ? errorData : JSON.stringify(errorData || {})
  ].filter(Boolean).join('\n');

  const actualModel =
    findModelIdInText(metadata.model) ||
    findModelIdInText(metadata.model_id) ||
    findModelIdInText(rawText) ||
    requestedModel;

  return {
    requestedModel,
    actualModel,
    providerName: metadata.provider_name || metadata.provider || '',
    retryAfterSeconds: normalizeRetryAfter(metadata.retry_after_seconds || metadata.retry_after_seconds_raw || retryAfterHeader),
    isAutoRoute: requestedModel === 'openrouter/free'
  };
}

function classifyGenerateError(message = '', statusCode) {
  const lower = String(message || '').toLowerCase();
  if (statusCode === 429 || lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit') || lower.includes('限流')) return 'rate_limit';
  if (statusCode === 403 || lower.includes('403') || lower.includes('no access') || lower.includes('not allowed') || lower.includes('无权限')) return 'no_access';
  if (statusCode === 400 && (lower.includes('not a valid model') || lower.includes('invalid model') || lower.includes('model id'))) return 'invalid_model';
  if (lower.includes('安全审核占位') || lower.includes('safety') || lower.includes('moderation')) return 'safety';
  if (lower.includes('空响应') || lower.includes('内容过短')) return 'empty';
  return 'unknown';
}

function createGenerateError(message, statusCode = 500, routeInfo, errorType) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.errorType = errorType || classifyGenerateError(message, statusCode);
  error.routeInfo = routeInfo ? {
    ...routeInfo,
    statusCode,
    errorType: routeInfo.errorType || error.errorType
  } : undefined;
  return error;
}

function parseGeneratedLog(rawText) {
  const cleaned = rawText
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let title = '日常开发维护';
  let content = cleaned;

  const titleMatch = cleaned.match(/(?:^|\n)\s*标题\s*[:：]\s*(.+?)(?=\n|$)/);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim().replace(/^["“]|["”]$/g, '');
  }

  const contentMatch = cleaned.match(/(?:^|\n)\s*内容\s*[:：]\s*([\s\S]+)/);
  if (contentMatch && contentMatch[1]) {
    content = contentMatch[1].trim();
  } else if (titleMatch) {
    content = cleaned
      .replace(/(?:^|\n)\s*标题\s*[:：]\s*.+?(?=\n|$)/, '')
      .trim();
  }

  content = content
    .replace(/(?:^|\n)\s*内容\s*[:：]\s*/g, '\n')
    .trim();

  if (title.length > 30) {
    title = title.slice(0, 30);
  }

  return { title, content };
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
  const { date, title, hours, cooperation, difficulty, content, job, customJobName, tone, isAutoGenerated } = req.body;
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
    customJobName,
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
  const { job, customJobName, tone, similarityThreshold, rollingDays, customTemplates, aiApiKey, aiApiUrl, aiModel, aiEnabled, saveKeyToCloud } = req.body;
  const db = readDB();

  if (!db.users[username]) {
    return res.status(401).json({ error: '当前用户未登录或失效！' });
  }

  db.users[username].settings = {
    ...db.users[username].settings,
    job: job || db.users[username].settings.job,
    customJobName: customJobName !== undefined ? String(customJobName) : db.users[username].settings.customJobName,
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
  const { userInput, job, customJobName, tone, mode, currentTitle, currentContent, aiApiKey, aiApiUrl, aiModel } = req.body;

  const db = readDB();
  const user = db.users[username] || { settings: {} };

  const finalApiKey = aiApiKey || user.settings.aiApiKey;
  const finalApiUrl = aiApiUrl || user.settings.aiApiUrl || DEFAULT_AI_API_URL;
  const fallbackModel = isOpenRouterApiUrl(finalApiUrl) ? DEFAULT_AI_MODEL : '';
  const finalApiModel = normalizeModelId(aiModel || user.settings.aiModel || fallbackModel, finalApiUrl);

  if (!finalApiKey) {
    return res.status(400).json({ error: '在线大模型接口未配置 API 密钥 (API Key)！请先前往设置或首页申请配置。' });
  }

  if (!finalApiModel) {
    return res.status(400).json({
      error: '当前上游接口未选择可用模型，请先同步模型列表或手动填写该上游支持的模型 ID。',
      routeInfo: {
        requestedModel: '',
        actualModel: '',
        statusCode: 400,
        errorType: 'invalid_model'
      }
    });
  }

  const isDoubaoPromptMode = mode === 'doubao_prompt';

  if (mode === 'tweak' && !String(currentContent || '').trim()) {
    return res.status(400).json({
      error: '当前没有可微调的日报内容，请先生成日报。',
      routeInfo: {
        requestedModel: finalApiModel,
        actualModel: finalApiModel,
        statusCode: 400,
        errorType: 'empty'
      }
    });
  }

  const jobName = getJobDisplayName(job, customJobName);
  const isTweakMode = mode === 'tweak';
  const promptTaskMode = isDoubaoPromptMode ? 'idle' : mode;
  const tasksText = (isTweakMode || isDoubaoPromptMode) ? '' : buildTaskSeed(userInput, job, promptTaskMode, customJobName);
  const doubaoTasksText = buildTaskSeed(userInput, job, userInput && String(userInput).trim() ? 'task' : 'idle', customJobName);

  const examples = job === 'designer' ? `
* 不推荐（太虚太浮夸）：
“针对产品核心展示模块进行了全方位的交互体验设计与视觉包装升级，构建了高复用的视觉规范，显著提升了页面在跨终端环境下的用户体感和开发对接效率。”
* 推荐（写实自然）：
“上午把几个历史页面的视觉稿翻出来重新核了下间距和字号，顺手把图层命名和组件分组理顺了。下午对照产品线框补了两个状态页的小细节，又把切图和标注整理了一版，方便后面开发同事对照。”
` : (job === 'tester' ? `
* 不推荐（太虚太浮夸）：
“围绕本版本核心质量保障体系开展了全链路验证，显著提升了系统稳定性与交付可信度，为业务上线提供了坚实保障。”
* 推荐（写实自然）：
“上午按测试用例把登录和列表流程重新跑了一遍，把两个异常提示不一致的问题记录了下来。下午复测了昨天修的几个 Bug，补了截图和复现步骤，方便开发继续跟。”
` : `
* 不推荐（太虚太浮夸）：
“深度重构了系统核心列表渲染组件，引入了基于虚拟滚动的高效异步加载算法，成功缩减了打包体积，显著优化了页面在低端机型下的首屏交互流畅度。”
* 推荐（写实自然）：
“上午把几个历史页面在不同宽度下的展示看了一遍，顺手调了下按钮间距和空状态文案。下午清理了控制台里几个重复警告，把公共组件的入参又核了一遍，最后在本地跑了下常用流程回归。”
`);

  const toneHint = tone === 'daily'
    ? '语气可以更像自然流水账，但仍要具体、可信，不要过度口语到像聊天。'
    : '语气保持专业严谨，但不要官腔、不要夸大成果。';

  const systemPrompt = isDoubaoPromptMode
    ? `你是一个专业提示词工程师，熟悉 ${jobName} 的公司日报写作。`
    : `你是一个专业 ${jobName}，擅长把当天真实工作记录整理成平实、具体、有执行细节的公司内部日报。`;
  const userPrompt = isDoubaoPromptMode ? `请生成一段可以直接复制到豆包的新对话里使用的中文提示词，目标是让豆包帮我写一份 ${jobName} 的公司内部日报。

今日工作记录：${doubaoTasksText}

生成提示词要求：
1. 提示词要以“你是一个专业 ${jobName}”开头，用户复制后可以直接发给豆包。
2. 提示词里要明确要求豆包输出“标题”和“内容”，内容必须是 3 条，每条 45 到 70 个中文字左右。
3. 语气要求：${toneHint}
4. 重点要求写实、具体、有过程，不要夸张成果，不要编造数据、奖项或上线影响。
5. 如果今日工作记录偏日常维护，也要让豆包自然补充检查、整理、复测、归档等合理细节。
6. 只输出最终提示词本身，不要解释、不要 Markdown 代码块、不要前后缀说明。` : (isTweakMode ? `请对下面这份已经生成好的日报做“轻微微调”，目标是降低重复感、让表达更自然，但不要改岗位、不要换主题、不要增加夸张成果或编造不存在的工作。

当前标题：${String(currentTitle || '').trim() || '未填写'}

当前内容：
${String(currentContent || '').trim()}

微调要求：
1. ${toneHint}
2. 保留原本工作事实和大致结构，只替换部分措辞、补一点具体过程或检查结果。
3. 必须仍然写成 3 条内容，每条 45 到 70 个中文字左右，总体约 170 到 230 字。
4. 不要把内容改成本地模板式“日常维护”，也不要偏离当前日报已经写到的工作范围。
5. 标题 8 到 15 个字，具体一点，可在原标题基础上小幅改写。

请严格按照以下格式直接输出（不要有任何多余的 Markdown 代码块或前后缀解释说明）：
标题：[微调后的日志标题]
内容：
1. [第一条微调后的内容]
2. [第二条微调后的内容]
3. [第三条微调后的内容]` : `请把下面这段今日工作记录整理成一份日常工作日志。

今日工作记录：${tasksText}

要求：
1. ${toneHint}
2. 必须写成 3 条内容，每条 45 到 70 个中文字左右，总体约 170 到 230 字。
3. 每条都要包含“做了什么 + 怎么处理 + 检查/整理结果”，不要只写“调整配置”“自测完成”这种短句。
4. 可以在给定工作范围内补充合理执行步骤，比如核对页面、调整样式、清理日志、整理组件、联调接口、本地回归等。
5. 标题 8 到 15 个字，具体一点，不要叫“今日工作简报”。

请参考并对比以下写作风格：
${examples}

请严格按照以下格式直接输出（不要有任何多余的 Markdown 代码块或前后缀解释说明）：
标题：[极简日志标题]
内容：
1. [第一条工作内容，45 到 70 个中文字，写实有过程]
2. [第二条工作内容，45 到 70 个中文字，写实有过程]
3. [第三条工作内容，45 到 70 个中文字，带检查或整理结果]`);

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
      let errData = errText;
      try {
        errData = JSON.parse(errText);
      } catch (e) {
        // Keep the raw text if the upstream did not return JSON.
      }
      const routeInfo = extractRouteInfoFromErrorData(errData, finalApiModel, response.headers.get('retry-after'));
      const upstreamMessage = typeof errData === 'string'
        ? errData
        : (errData?.error?.message || errData?.message || errText);
      const errorType = classifyGenerateError(upstreamMessage, response.status);
      throw createGenerateError(`API 平台响应错误: ${response.status} - ${upstreamMessage}`, response.status, {
        ...routeInfo,
        errorType
      }, errorType);
    }

    const apiData = await response.json();
    const routeInfo = extractRouteInfoFromApiData(apiData, finalApiModel);

    if (!apiData.choices || apiData.choices.length === 0 || !apiData.choices[0].message) {
      throw createGenerateError('API 平台返回了空响应，请切换其他免费推荐大模型或稍后重试！', 502, routeInfo, 'empty');
    }

    const contentVal = apiData.choices[0].message.content;
    if (contentVal === null || contentVal === undefined) {
      throw createGenerateError('大模型内容被平台过滤或响应为空，请换个模型重新尝试！', 502, routeInfo, 'empty');
    }

    const rawText = contentVal.trim();
    
    // 拦截上游安全过滤器返回的无效占位文本，例如 "User Safety: safe"。
    if (isSafetyPlaceholder(rawText)) {
      throw createGenerateError('上游安全内容拦截: 大模型返回了安全审核占位词，请切换其他模型重新尝试！', 502, routeInfo, 'safety');
    }

    if (rawText.length < 15) {
      throw createGenerateError('API 平台返回内容过短，未形成可用日报，请稍后重试或切换其他模型。', 502, routeInfo, 'empty');
    }

    if (isDoubaoPromptMode) {
      res.json({
        success: true,
        title: '复制提示词到豆包生成',
        content: rawText,
        routeInfo
      });
      return;
    }

    const { title, content } = parseGeneratedLog(rawText);

    res.json({ success: true, title, content, routeInfo });
  } catch (error) {
    console.error('在线 AI 生成请求失败:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || '大模型生成请求失败',
      routeInfo: error.routeInfo ? {
        ...error.routeInfo,
        statusCode: error.statusCode || error.routeInfo.statusCode,
        errorType: error.errorType || error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode)
      } : undefined
    });
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
