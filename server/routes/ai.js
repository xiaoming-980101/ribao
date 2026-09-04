import express from 'express';
import { readDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  isSafetyPlaceholder,
  stripThinkingProcess,
  isThinkingGarbage,
  extractRouteInfoFromErrorData,
  classifyGenerateError,
  createGenerateError,
  extractRouteInfoFromApiData,
  extractResponseText
} from '../utils/modelUtils.js';
import {
  getJobDisplayName,
  buildPrompts,
  parseGeneratedLog,
  buildDirectionsPrompt,
  parseDirections,
  buildTaskSeed
} from '../utils/aiPrompt.js';
import {
  resolveAiConfig,
  resolveRecentLogs,
  callChatCompletion,
  fetchUpstreamModels,
  isFreeModel
} from '../utils/aiUpstream.js';

const router = express.Router();

// 统一应用鉴权中间件
router.use(authMiddleware);

/** 取当前登录用户的数据记录 */
function currentUser(req) {
  return readDB().users[req.username];
}

// API: 获取 AI 启发式工作方向推荐 (5 个切入点卡片)
router.post('/directions', async (req, res) => {
  const user = currentUser(req);
  const { mode, platform, recentLogs } = req.body;
  const cfg = resolveAiConfig(user, req.body);

  // 未配置密钥或模型时，直接使用内置方向引擎
  const localDirections = () => parseDirections('', cfg.job, mode, cfg.customJobName, platform);

  if (!cfg.apiKey || !cfg.model) {
    return res.json({ success: true, directions: localDirections(), isOffline: true });
  }

  const { systemPrompt, userPrompt } = buildDirectionsPrompt({
    job: cfg.job,
    customJobName: cfg.customJobName,
    mode,
    platform,
    recentLogs: resolveRecentLogs(user, recentLogs)
  });

  const result = await callChatCompletion({
    apiKey: cfg.apiKey,
    apiUrl: cfg.apiUrl,
    model: cfg.model,
    systemPrompt,
    userPrompt,
    temperature: 0.85,
    maxTokens: 1200
  });

  // 方向推荐属于辅助能力，上游任何失败都无缝降级到本地场景库
  if (!result.ok) {
    console.warn('[ai] 方向推荐上游失败，降级本地场景库:', result.status, result.upstreamMessage);
    return res.json({ success: true, directions: localDirections(), isOffline: true });
  }

  const { rawText } = extractResponseText(result.data);

  res.json({
    success: true,
    directions: parseDirections(rawText, cfg.job, mode, cfg.customJobName, platform),
    isOffline: false
  });
});

// API: 在线调用 AI 生成日报
router.post('/generate', async (req, res) => {
  const user = currentUser(req);
  const { userInput, mode, currentTitle, currentContent, recentLogs } = req.body;
  const cfg = resolveAiConfig(user, req.body);

  if (!cfg.apiKey) {
    return res.status(400).json({ error: '在线大模型接口未配置 API 密钥 (API Key)！请先前往设置或首页申请配置。' });
  }

  if (!cfg.model) {
    return res.status(400).json({
      error: '当前上游接口未选择可用模型，请先同步模型列表或手动填写该上游支持的模型 ID。',
      routeInfo: { requestedModel: '', actualModel: '', statusCode: 400, errorType: 'invalid_model' }
    });
  }

  if (mode === 'tweak' && !String(currentContent || '').trim()) {
    return res.status(400).json({
      error: '当前没有可微调的日报内容，请先生成日报。',
      routeInfo: { requestedModel: cfg.model, actualModel: cfg.model, statusCode: 400, errorType: 'empty' }
    });
  }

  const isDoubaoPromptMode = mode === 'doubao_prompt';

  // 岗位/语气一律使用解析后的最终值，确保请求体未携带时用户已保存的设置仍然生效
  const { systemPrompt, userPrompt } = buildPrompts({
    userInput,
    job: cfg.job,
    customJobName: cfg.customJobName,
    tone: cfg.tone,
    mode,
    currentTitle,
    currentContent,
    recentLogs: resolveRecentLogs(user, recentLogs)
  });

  try {
    const result = await callChatCompletion({
      apiKey: cfg.apiKey,
      apiUrl: cfg.apiUrl,
      model: cfg.model,
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 1500
    });

    if (!result.ok) {
      // 网络层失败（含超时）没有上游 routeInfo 可用，仅回传原因
      if (result.kind === 'network') {
        throw createGenerateError(result.upstreamMessage, result.timeout ? 504 : 500);
      }
      const routeInfo = extractRouteInfoFromErrorData(result.errorData, cfg.model, result.retryAfter);
      const errorType = classifyGenerateError(result.upstreamMessage, result.status);
      throw createGenerateError(
        `API 平台响应错误: ${result.status} - ${result.upstreamMessage}`,
        result.status,
        { ...routeInfo, errorType },
        errorType
      );
    }

    const apiData = result.data;
    const routeInfo = extractRouteInfoFromApiData(apiData, cfg.model);
    const { rawText } = extractResponseText(apiData);
    const strippedText = stripThinkingProcess(rawText);

    if (!rawText || rawText.length < 5 || isSafetyPlaceholder(rawText)) {
      console.warn('[ai] 上游返回空响应或安全占位符，切换本地拟人引擎生成');
      const effectiveInput = userInput || buildTaskSeed('', cfg.job, mode, cfg.customJobName);
      const cleanSeed = effectiveInput.replace(/^[【“]|[”】]$/g, '');
      let defaultTitle = '';
      if (cleanSeed.includes('：')) defaultTitle = cleanSeed.split('：')[0].trim();
      else if (cleanSeed.includes(':')) defaultTitle = cleanSeed.split(':')[0].trim();
      else defaultTitle = cleanSeed.slice(0, 14);
      if (!defaultTitle) defaultTitle = cfg.job === 'frontend' ? '前端页面交互与逻辑优化' : '日常开发与维护推进';

      return res.json({
        success: true,
        title: defaultTitle,
        content: `今天主要推进了${cleanSeed}相关工作，核对并处理了部分细节与边界交互，在本地各场景跑了一遍自测，运行一切正常。`,
        routeInfo: { ...routeInfo, isFallback: true }
      });
    }

    if (isDoubaoPromptMode) {
      return res.json({ success: true, title: '复制提示词到豆包生成', content: strippedText || rawText, routeInfo });
    }

    const parsedLog = parseGeneratedLog(rawText, currentTitle, currentContent);
    if (parsedLog.isInvalid || isThinkingGarbage(parsedLog.content) || isThinkingGarbage(parsedLog.title)) {
      console.warn('[ai] 提取结果命中思考链垃圾或解析异常，切换本地拟人引擎兜底');
      const effectiveInput = userInput || buildTaskSeed('', cfg.job, mode, cfg.customJobName);
      const cleanSeed = effectiveInput.replace(/^[【“]|[”】]$/g, '');
      let defaultTitle = '';
      if (cleanSeed.includes('：')) defaultTitle = cleanSeed.split('：')[0].trim();
      else if (cleanSeed.includes(':')) defaultTitle = cleanSeed.split(':')[0].trim();
      else defaultTitle = cleanSeed.slice(0, 14);
      if (!defaultTitle) defaultTitle = cfg.job === 'frontend' ? '前端页面交互与逻辑优化' : '日常开发与维护推进';

      return res.json({
        success: true,
        title: defaultTitle,
        content: `今天主要推进了${cleanSeed}相关工作，核对并处理了部分细节与边界交互，在本地各场景跑了一遍自测，运行一切正常。`,
        routeInfo: { ...routeInfo, isFallback: true }
      });
    }

    res.json({ success: true, title: parsedLog.title, content: parsedLog.content, routeInfo });
  } catch (error) {
    console.error('[ai] 在线生成请求失败:', error.message);
    res.status(error.statusCode || 500).json({
      error: error.message || '大模型生成请求失败',
      routeInfo: error.routeInfo
        ? {
            ...error.routeInfo,
            statusCode: error.statusCode || error.routeInfo.statusCode,
            errorType: error.errorType || error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode)
          }
        : undefined
    });
  }
});

// API: 动态拉取并同步大模型列表 (中转转发 /v1/models)
router.post('/models', async (req, res) => {
  const cfg = resolveAiConfig(currentUser(req), req.body);

  if (!cfg.apiKey) {
    return res.status(400).json({ error: '请先填入 API 密钥以获取模型列表！' });
  }

  const result = await fetchUpstreamModels({ apiKey: cfg.apiKey, apiUrl: cfg.apiUrl });
  if (!result.ok) {
    console.error('[ai] 获取大模型列表失败:', result.upstreamMessage);
    return res.status(502).json({ error: result.upstreamMessage });
  }

  const models = (result.data.data || []).map((item) => ({
    id: item.id,
    name: item.name || item.id,
    isFree: isFreeModel(item)
  }));

  res.json({ success: true, models });
});

// API: AI 智能周报提炼与结构化总结
router.post('/weekly', async (req, res) => {
  const { startDate, endDate, weekLogs } = req.body;
  const cfg = resolveAiConfig(currentUser(req), req.body);
  const jobName = getJobDisplayName(cfg.job, cfg.customJobName);

  if (!Array.isArray(weekLogs) || weekLogs.length === 0) {
    return res.status(400).json({ error: '本周暂无有效事项记录可供提炼！' });
  }

  if (!cfg.apiKey || !cfg.model) {
    return res.status(400).json({ error: '未配置 API 密钥或模型，请在设置中配置后再试！' });
  }

  const formattedLogsText = weekLogs
    .map((item) => `[${item.date} (${item.dayName})] ${item.title} (工时: ${item.hours}h, 协作: ${item.cooperation ? '是' : '否'}, 难点: ${item.difficulty ? '是' : '否'})\n工作内容：\n${item.content}`)
    .join('\n\n---\n\n');

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

  const result = await callChatCompletion({
    apiKey: cfg.apiKey,
    apiUrl: cfg.apiUrl,
    model: cfg.model,
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 2000
  });

  if (!result.ok) {
    console.error('[ai] 周报提炼失败:', result.status, result.upstreamMessage);
    return res.status(result.kind === 'network' && result.timeout ? 504 : 502).json({
      error: result.upstreamMessage || 'AI 周报提炼请求失败'
    });
  }

  const rawReport = (result.data.choices?.[0]?.message?.content || '').trim();
  const cleanReport = stripThinkingProcess(rawReport) || rawReport;
  res.json({ success: true, report: cleanReport });
});

export default router;
