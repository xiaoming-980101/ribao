import { DEFAULT_AI_API_URL, DEFAULT_AI_MODEL, LEGACY_INVALID_MODELS } from '../config.js';

export function isOpenRouterApiUrl(aiApiUrl = DEFAULT_AI_API_URL) {
  return String(aiApiUrl || '').toLowerCase().includes('openrouter.ai');
}

export function normalizeModelId(modelId, aiApiUrl = DEFAULT_AI_API_URL) {
  const isOpenRouterApi = isOpenRouterApiUrl(aiApiUrl);
  if (!isOpenRouterApi && modelId === DEFAULT_AI_MODEL) return '';
  if (LEGACY_INVALID_MODELS.has(modelId)) return isOpenRouterApi ? DEFAULT_AI_MODEL : '';
  return modelId;
}

export function isSafetyPlaceholder(rawText) {
  const normalized = rawText.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!normalized) return false;

  return (
    /^(user|assistant)?\s*safety\s*:\s*(safe|unsafe|blocked)\.?$/.test(normalized) ||
    /^(moderation|content\s*safety)\s*:\s*(safe|unsafe|blocked)\.?$/.test(normalized) ||
    /^(safe|unsafe|blocked)\.?$/.test(normalized)
  );
}

/**
 * 参考 DEEIX-Chat 的多态响应解析机制：
 * 遍历提取可见正文与推理思考内容，兼顾 string / array of parts / object / reasoning_content / text
 */
export function extractChatVisibleText(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map(item => extractChatVisibleText(item))
      .filter(Boolean)
      .join('');
  }
  if (typeof raw === 'object') {
    const itemType = String(raw.type || '').toLowerCase();
    if (itemType.includes('reason') || itemType.includes('think') || itemType.includes('thought')) {
      return '';
    }
    if (typeof raw.text === 'string') return raw.text;
    if (typeof raw.output_text === 'string') return raw.output_text;
    if (typeof raw.input_text === 'string') return raw.input_text;
    if (raw.content) return extractChatVisibleText(raw.content);
  }
  return '';
}

export function extractChatReasoningText(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw
      .map(item => extractChatReasoningText(item))
      .filter(Boolean)
      .join('');
  }
  if (typeof raw === 'object') {
    const itemType = String(raw.type || '').toLowerCase();
    if (itemType.includes('reason') || itemType.includes('think') || itemType.includes('thought')) {
      return raw.text || raw.reasoning || raw.reasoning_content || raw.thought || raw.content || '';
    }
    return extractChatReasoningText(raw.content);
  }
  return '';
}

export function extractResponseText(apiData) {
  if (!apiData) return { visibleText: '', reasoningText: '', rawText: '' };

  const choice = apiData.choices?.[0] || {};
  const message = choice.message || choice || {};

  let visibleText = extractChatVisibleText(message.content || message.text || choice.text || apiData.text || '');
  let reasoningText = 
    (typeof message.reasoning_content === 'string' ? message.reasoning_content : '') ||
    (typeof message.reasoning === 'string' ? message.reasoning : '') ||
    (typeof message.thought === 'string' ? message.thought : '') ||
    extractChatReasoningText(message.content);

  // 如果某些聚合网关将实际生成内容放到了 reasoning 字段且 visibleText 为空
  if (!visibleText.trim() && reasoningText.trim()) {
    visibleText = reasoningText;
  }

  const rawText = visibleText.trim() || reasoningText.trim();

  return {
    visibleText: visibleText.trim(),
    reasoningText: reasoningText.trim(),
    rawText
  };
}

/**
 * 深度剥离大模型思考链 (Reasoning / CoT Trace / <think> 标签 / Thinking Process 等)
 */
export function stripThinkingProcess(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. 剥离完整的各类思考标签 (<think>, <thought>, <thinking>, <|thought|>, <|begin_of_thought|>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  text = text.replace(/<\|thought\|>[\s\S]*?<\|\/thought\|>/gi, '');
  text = text.replace(/<\|begin_of_thought\|>[\s\S]*?<\|end_of_thought\|>/gi, '');

  // 2. 剥离带有明显思考链前缀的段落 (如 "Here's a thinking process:", "Thinking Process:", "思考过程：" 等)
  const thinkingPrefixPattern = /^(?:Here(?:'s| is) (?:a )?(?:thinking process|thought process)|Thinking Process|Thought Process|Thinking:|【思考过程】|思考过程[：:])[\s\S]*?(?=(?:(?:\n|\r\n)\s*(?:\*\*|__)?(?:标题|事项名称|主题|Title|内容|工作内容|事项内容|流水|Content)(?:\*\*|__)?\s*[:：])|$)/i;
  text = text.replace(thinkingPrefixPattern, '');

  // 3. 如果整段文本仍残留思考链特征词，尝试精准截取最后的格式化输出段落
  if (/Here(?:'s| is) (?:a )?thinking process/i.test(text) || /Analyze the Request/i.test(text) || /Drafting - Step-by-step/i.test(text)) {
    const matchChineseSection = text.match(/(?:(?:\*\*|__)?(?:标题|内容|事项)(?:\*\*|__)?\s*[:：][\s\S]+$)/);
    if (matchChineseSection) {
      text = matchChineseSection[0];
    }
  }

  // 4. 清理 Markdown 代码块标记与多余首尾空白
  text = text
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim();

  return text;
}

/**
 * 校验提取的内容或标题是否属于未剥离干净的英文思考链垃圾信息或乱码
 */
export function isThinkingGarbage(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return true;

  const thinkingKeywords = [
    "here's a think",
    "here's a thinking process",
    "here is a thinking process",
    "thinking process",
    "thought process",
    "analyze the request",
    "let's break it down",
    "drafting - step-by-step",
    "step-by-step drafting",
    "i need to encapsulate"
  ];

  const lower = trimmed.toLowerCase();
  for (const kw of thinkingKeywords) {
    if (lower.startsWith(kw) || (lower.includes(kw) && (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length < 15)) {
      return true;
    }
  }

  // 若主要为英文且中文字符极少（< 8 个汉字，但英文 > 40 个字母），判定为纯英文思考链或乱码
  const chineseCharCount = (trimmed.match(/[\u4e00-\u9fa5]/g) || []).length;
  const totalLettersCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (totalLettersCount > 40 && chineseCharCount < 8) {
    return true;
  }

  return false;
}

export function findModelIdInText(text = '') {
  const matches = [...String(text).matchAll(/\b([a-z0-9_-]+\/[a-z0-9][a-z0-9_.:+-]*(?::free)?)\b/gi)]
    .map(match => match[1])
    .filter(modelId => !modelId.split('/')[0].includes('.'));

  return matches[0] || '';
}

export function normalizeRetryAfter(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.ceil(parsed) : undefined;
}

export function extractRouteInfoFromApiData(apiData, requestedModel) {
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

export function extractRouteInfoFromErrorData(errorData, requestedModel, retryAfterHeader) {
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

export function classifyGenerateError(message = '', statusCode) {
  const lower = String(message || '').toLowerCase();
  if (statusCode === 429 || lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit') || lower.includes('限流')) return 'rate_limit';
  if (statusCode === 403 || lower.includes('403') || lower.includes('no access') || lower.includes('not allowed') || lower.includes('无权限')) return 'no_access';
  if (statusCode === 400 && (lower.includes('not a valid model') || lower.includes('invalid model') || lower.includes('model id'))) return 'invalid_model';
  if (lower.includes('安全审核占位') || lower.includes('safety') || lower.includes('moderation')) return 'safety';
  if (lower.includes('空响应') || lower.includes('内容过短')) return 'empty';
  return 'unknown';
}

export function createGenerateError(message, statusCode = 500, routeInfo, errorType) {
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
