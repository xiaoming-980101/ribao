import { ModelOption } from './storage';
import { RouteInfo } from '../types/ai';

export const checkIsRecommended = (m: { id: string; name: string; isFree: boolean }) => {
  const idLower = m.id.toLowerCase();
  if (m.isFree) {
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('coder')) return true;
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('next')) return true;
    if (idLower.includes('llama') && idLower.includes('3.3')) return true;
    if (idLower.includes('gemma')) return true;
  }
  return false;
};

export const formatSelectedModel = (modelId: string) => modelId.split('/').pop() || modelId;

export const formatRouteLabel = (routeInfo?: RouteInfo | null) => {
  if (!routeInfo) return '';
  const parts = [
    routeInfo.actualModel || routeInfo.requestedModel,
    routeInfo.providerName
  ].filter(Boolean);
  return parts.join(' · ');
};

export const formatRouteTitle = (routeInfo?: RouteInfo | null) => {
  if (!routeInfo) return '';
  const retryText = routeInfo.retryAfterSeconds ? `；建议 ${routeInfo.retryAfterSeconds} 秒后重试` : '';
  const statusText = routeInfo.statusCode ? `；状态码：${routeInfo.statusCode}` : '';
  return `请求模型：${routeInfo.requestedModel || '未知'}；实际模型：${routeInfo.actualModel || '未知'}${routeInfo.providerName ? `；Provider：${routeInfo.providerName}` : ''}${statusText}${retryText}`;
};

export const getDefaultModelOptions = (aiApiUrl: string, defaultModel: string, isOpenRouterApiUrl: (url: string) => boolean): ModelOption[] => (
  isOpenRouterApiUrl(aiApiUrl)
    ? [{ id: defaultModel, name: 'OpenRouter: Free Auto-Route (免费自动路由)', isFree: true }]
    : []
);

export const LEGACY_INVALID_MODELS = new Set([
  'qwen/qwen-3-coder:free'
]);

export const normalizeModelId = (modelId: string, aiApiUrl: string, defaultModel: string, isOpenRouterApiUrl: (url: string) => boolean) => {
  const isOpenRouterApi = isOpenRouterApiUrl(aiApiUrl);
  if (!isOpenRouterApi && modelId === defaultModel) return '';
  if (LEGACY_INVALID_MODELS.has(modelId)) return isOpenRouterApi ? defaultModel : '';
  return modelId;
};

export const buildFallbackQueue = (
  currentModel: string,
  models: ModelOption[] = [],
  aiApiUrl: string,
  defaultModel: string,
  isOpenRouterApiUrl: (url: string) => boolean
) => {
  const seen = new Set<string>();
  const recommendedFree = models
    .filter((model) => model.isFree && checkIsRecommended(model))
    .map((model) => model.id);
  const otherFree = models
    .filter((model) => model.isFree && !checkIsRecommended(model))
    .map((model) => model.id);

  const defaultModels = getDefaultModelOptions(aiApiUrl, defaultModel, isOpenRouterApiUrl).map((model) => model.id);

  return [normalizeModelId(currentModel, aiApiUrl, defaultModel, isOpenRouterApiUrl), ...defaultModels, ...recommendedFree, ...otherFree]
    .filter((modelId) => {
      if (!modelId || LEGACY_INVALID_MODELS.has(modelId) || seen.has(modelId)) return false;
      seen.add(modelId);
      return true;
    })
    .slice(0, 5);
};

export const buildDefaultCompareModels = (
  currentModel: string,
  models: ModelOption[] = [],
  aiApiUrl: string,
  defaultModel: string,
  isOpenRouterApiUrl: (url: string) => boolean
) => buildFallbackQueue(currentModel, models, aiApiUrl, defaultModel, isOpenRouterApiUrl).slice(0, 3);

export const classifyGenerateError = (message: string = '', statusCode?: number): RouteInfo['errorType'] => {
  const lower = message.toLowerCase();
  if (statusCode === 429 || lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit') || lower.includes('限流')) return 'rate_limit';
  if (statusCode === 403 || lower.includes('403') || lower.includes('no access') || lower.includes('not allowed') || lower.includes('无权限')) return 'no_access';
  if (statusCode === 400 && (lower.includes('not a valid model') || lower.includes('invalid model') || lower.includes('model id'))) return 'invalid_model';
  if (lower.includes('安全审核占位') || lower.includes('safety') || lower.includes('moderation')) return 'safety';
  if (lower.includes('空响应') || lower.includes('内容过短')) return 'empty';
  return 'unknown';
};

export const formatErrorReason = (error?: string, routeInfo?: RouteInfo) => {
  const errorType = routeInfo?.errorType || classifyGenerateError(error || '', routeInfo?.statusCode);
  if (errorType === 'no_access') return '当前 Key 无权限';
  if (errorType === 'invalid_model') return '模型 ID 已失效';
  if (errorType === 'rate_limit') return routeInfo?.retryAfterSeconds ? `限流，约 ${routeInfo.retryAfterSeconds} 秒后可重试` : '限流';
  if (errorType === 'safety') return '上游安全审核占位';
  if (errorType === 'empty') return '返回内容不可用';
  return error || '模型请求失败';
};
