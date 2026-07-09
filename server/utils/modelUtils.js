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
