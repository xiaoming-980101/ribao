import express from 'express';
import { readDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { DEFAULT_AI_API_URL, DEFAULT_AI_MODEL } from '../config.js';
import {
  isOpenRouterApiUrl,
  normalizeModelId,
  isSafetyPlaceholder,
  extractRouteInfoFromErrorData,
  classifyGenerateError,
  createGenerateError,
  extractRouteInfoFromApiData,
} from '../utils/modelUtils.js';
import { getJobDisplayName, buildPrompts, parseGeneratedLog, buildDirectionsPrompt, parseDirections, buildTaskSeed } from '../utils/aiPrompt.js';

const router = express.Router();

// 统一应用鉴权中间件
router.use(authMiddleware);

// API: 获取 AI 启发式工作方向推荐 (5 个切入点卡片)
router.post('/directions', async (req, res) => {
  const username = req.username;
  const {
    job,
    customJobName,
    mode,
    recentLogs,
    aiApiKey,
    aiApiUrl,
    aiModel
  } = req.body;

  const db = readDB();
  const user = db.users[username];

  const finalApiKey = aiApiKey || user?.settings?.aiApiKey;
  const finalApiUrl = aiApiUrl || user?.settings?.aiApiUrl || DEFAULT_AI_API_URL;
  const fallbackModel = isOpenRouterApiUrl(finalApiUrl) ? DEFAULT_AI_MODEL : '';
  const finalApiModel = normalizeModelId(aiModel || user?.settings?.aiModel || fallbackModel, finalApiUrl);

  let historyLogs = Array.isArray(recentLogs) ? recentLogs : [];
  if (historyLogs.length === 0 && user && user.logs) {
    historyLogs = Object.entries(user.logs)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([date, item]) => ({
        date,
        title: item.title,
        content: item.content
      }));
  }

  // 如果未配置 API Key，直接使用高质量内置方向引擎返回
  if (!finalApiKey || !finalApiModel) {
    const directions = parseDirections('', job, mode, customJobName);
    return res.json({ success: true, directions, isOffline: true });
  }

  const { systemPrompt, userPrompt } = buildDirectionsPrompt({
    job,
    customJobName,
    mode,
    recentLogs: historyLogs
  });

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
        temperature: 0.85,
        max_tokens: 1200
      }),
      signal: AbortSignal.timeout(180000)
    });

    if (!response.ok) {
      console.warn(`AI directions upstream returned ${response.status}, fallback to local scenario pool`);
      const directions = parseDirections('', job, mode, customJobName);
      return res.json({ success: true, directions, isOffline: true });
    }

    const apiData = await response.json();
    const dirMsg = apiData.choices?.[0]?.message;
    const contentVal = (dirMsg?.content || dirMsg?.reasoning || '');
    const directions = parseDirections(contentVal, job, mode, customJobName);

    res.json({ success: true, directions, isOffline: false });
  } catch (error) {
    console.warn('AI directions request failed, fallback to local scenario pool:', error);
    const directions = parseDirections('', job, mode, customJobName);
    res.json({ success: true, directions, isOffline: true });
  }
});

// API: 在线调用 AI 生成日报
router.post('/generate', async (req, res) => {
  const username = req.username;
  const {
    userInput,
    job,
    customJobName,
    tone,
    mode,
    currentTitle,
    currentContent,
    recentLogs,
    aiApiKey,
    aiApiUrl,
    aiModel
  } = req.body;

  const db = readDB();
  const user = db.users[username];

  const finalJob = job || user.settings.job || 'frontend';
  const finalCustomJobName = finalJob === 'custom' ? (customJobName || user.settings.customJobName || '') : '';
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

  let historyLogs = Array.isArray(recentLogs) ? recentLogs : [];
  if (historyLogs.length === 0 && user && user.logs) {
    historyLogs = Object.entries(user.logs)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([date, item]) => ({
        date,
        title: item.title,
        content: item.content
      }));
  }

  const { systemPrompt, userPrompt } = buildPrompts({
    userInput,
    job,
    customJobName,
    tone,
    mode,
    currentTitle,
    currentContent,
    recentLogs: historyLogs
  });

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
        temperature: 0.8,
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(180000)
    });

    if (!response.ok) {
      const errText = await response.text();
      let errData = errText;
      try {
        errData = JSON.parse(errText);
      } catch (e) {}
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

        const contentVal = apiData.choices?.[0]?.message?.content;
    let rawText = typeof contentVal === 'string' ? contentVal.trim() : '';

    if (!rawText || rawText.length < 10 || isSafetyPlaceholder(rawText)) {
      console.warn('上游大模型返回空响应或占位符，自动启用本地高质量拟人引擎生成');
      // 本地智能生成
      const effectiveInput = userInput || buildTaskSeed('', job, mode, customJobName);
      const fallbackTitle = (job === 'frontend' ? '前端页面交互与逻辑优化' : '日常开发与维护推进');
      const fallbackContent = `今天主要推进了${effectiveInput.replace(/^[【“]|[”】]$/g, '')}相关工作，核对并处理了部分细节与边界交互，在本地各场景跑了一遍自测，运行一切正常。`;
      return res.json({
        success: true,
        title: fallbackTitle,
        content: fallbackContent,
        routeInfo: { ...routeInfo, isFallback: true }
      });
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

    const parsedLog = parseGeneratedLog(rawText, currentTitle, currentContent);

    res.json({ success: true, title: parsedLog.title, content: parsedLog.content, routeInfo });
  } catch (error) {
    console.error('在线 AI 生成请求失败:', error);
    const isTimeout = error.name === 'TimeoutError' || String(error.message || '').includes('timeout');
    const finalErrorMessage = isTimeout 
      ? '上游模型供应商轮询响应超时（已等待 3 分钟未返回），请稍后再试或切换其他模型通道。'
      : (error.message || '大模型生成请求失败');
    res.status(error.statusCode || (isTimeout ? 504 : 500)).json({
      error: finalErrorMessage,
      routeInfo: error.routeInfo ? {
        ...error.routeInfo,
        statusCode: error.statusCode || error.routeInfo.statusCode,
        errorType: error.errorType || error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode)
      } : undefined
    });
  }
});

// API: 动态拉取并同步大模型列表 (中转转发 /v1/models)
router.post('/models', async (req, res) => {
  const username = req.username;
  const { aiApiKey, aiApiUrl } = req.body;

  const db = readDB();
  const user = db.users[username];

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

// API: AI 智能周报提炼与结构化总结
router.post('/weekly', async (req, res) => {
  const username = req.username;
  const {
    job,
    customJobName,
    startDate,
    endDate,
    weekLogs,
    aiApiKey,
    aiApiUrl,
    aiModel
  } = req.body;

  const db = readDB();
  const user = db.users[username];

  const finalJob = job || user?.settings?.job || 'frontend';
  const finalCustom = finalJob === 'custom' ? (customJobName || user?.settings?.customJobName || '') : '';
  const finalApiKey = aiApiKey || user?.settings?.aiApiKey;
  const finalApiUrl = aiApiUrl || user?.settings?.aiApiUrl || DEFAULT_AI_API_URL;
  const fallbackModel = isOpenRouterApiUrl(finalApiUrl) ? DEFAULT_AI_MODEL : '';
  const finalApiModel = normalizeModelId(aiModel || user?.settings?.aiModel || fallbackModel, finalApiUrl);

  const jobName = getJobDisplayName(finalJob, finalCustom);

  if (!Array.isArray(weekLogs) || weekLogs.length === 0) {
    return res.status(400).json({ error: '本周暂无有效事项记录可供提炼！' });
  }

  // 格式化传入的日志摘要
  const formattedLogsText = weekLogs.map((item, idx) => {
    return `[${item.date} (${item.dayName})] ${item.title} (工时: ${item.hours}h, 协作: ${item.cooperation ? '是' : '否'}, 难点: ${item.difficulty ? '是' : '否'})\n工作内容：\n${item.content}`;
  }).join('\n\n---\n\n');

  const systemPrompt = `你是一位严谨、资深的 ${jobName} 研发技术主管，擅长将工程师一周内琐碎的日常日志提炼、升华为结构清晰、重点突出、极具业务与工程交付价值的专业工作周报。`;
  const userPrompt = `请根据以下工程师在 ${startDate} 至 ${endDate} 期间记录的每日工作日志，提炼并生成一份高质量的周期事项工作报告。

【每日工作日志流水】：
${formattedLogsText}

【周报生成要求】：
1. 报告必须包含以下三大部分，且各部分条理分明：
   ### 一、本周重点交付与推进
   （合并归类相似工作，提炼出 3-5 条具备业务价值或工程闭环的核心交付成果，不要简单照搬日记，使用量化与技术动词）
   
   ### 二、关键成果与协同攻坚
   （重点提炼攻克的技术难点、系统调优、慢查询/并发/边界Bug排查，以及跨团队/前后端协同交付成果；若无明显难点则总结常规质量保障）
   
   ### 三、下周工作规划
   （结合本周推进情况与后续合理延伸，推导列出 2-3 条切实可行、条理清晰的下周排期规划）

2. 严禁使用官腔大词或空洞口号，突出真实技术细节与交付物。
3. 直接以 Markdown 格式输出周报内容主体。`;

  if (!finalApiKey || !finalApiModel) {
    return res.status(400).json({ error: '未配置 API 密钥或模型，请在设置中配置后再试！' });
  }

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
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(180000)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`上游接口响应错误: ${response.status} - ${errText}`);
    }

    const apiData = await response.json();
    const rawReport = apiData.choices?.[0]?.message?.content || '';

    res.json({
      success: true,
      report: rawReport.trim()
    });
  } catch (err) {
    console.error('AI 周报提炼失败:', err);
    res.status(500).json({ error: err.message || 'AI 周报提炼请求失败' });
  }
});

export default router;
