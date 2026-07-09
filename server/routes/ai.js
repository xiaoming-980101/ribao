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
import { getJobDisplayName, buildTaskSeed, parseGeneratedLog } from '../utils/aiPrompt.js';

const router = express.Router();

// 统一应用鉴权中间件
router.use(authMiddleware);

// API: 在线调用 AI 生成日报
router.post('/generate', async (req, res) => {
  const username = req.username;
  const { userInput, job, customJobName, tone, mode, currentTitle, currentContent, aiApiKey, aiApiUrl, aiModel } = req.body;

  const db = readDB();
  const user = db.users[username];

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

    const parsedLog = parseGeneratedLog(rawText);

    res.json({ success: true, title: parsedLog.title, content: parsedLog.content, routeInfo });
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

export default router;
