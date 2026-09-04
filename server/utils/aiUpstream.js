/**
 * 大模型上游调用的统一封装
 *
 * /directions、/generate、/models、/weekly 四个路由此前各自重复实现了
 * 「配置解析 → 拼接上游 URL → 带鉴权 fetch → 解析响应」，共约 120 行重复代码。
 * 这里收敛为单一实现，路由只负责组装 prompt 与决定失败策略。
 */

import { DEFAULT_AI_API_URL, DEFAULT_AI_MODEL } from '../config.js';
import { isOpenRouterApiUrl, normalizeModelId } from './modelUtils.js';

/** 上游请求默认超时（ms）：支持 OpenRouter 多上游轮询，保留 3 分钟 */
export const UPSTREAM_TIMEOUT_MS = 180000;
/** 模型列表拉取超时（ms）：纯元数据请求，无需等待 3 分钟 */
export const MODELS_TIMEOUT_MS = 30000;

/**
 * 解析本次调用最终生效的岗位与上游配置。
 * 请求体未显式传入的字段一律回落到该用户已保存的设置，
 * 避免出现「算出兜底值却没用上，导致用户设置失效」的问题。
 */
export function resolveAiConfig(user, body = {}) {
  const settings = (user && user.settings) || {};

  const job = body.job || settings.job || 'frontend';
  const customJobName = job === 'custom'
    ? (body.customJobName || settings.customJobName || '')
    : '';
  const tone = body.tone || settings.tone || 'professional';

  const apiKey = body.aiApiKey || settings.aiApiKey || '';
  const apiUrl = body.aiApiUrl || settings.aiApiUrl || DEFAULT_AI_API_URL;
  const fallbackModel = isOpenRouterApiUrl(apiUrl) ? DEFAULT_AI_MODEL : '';
  const model = normalizeModelId(body.aiModel || settings.aiModel || fallbackModel, apiUrl);

  return { job, customJobName, tone, apiKey, apiUrl, model };
}

/** 把上游基准地址与端点拼成完整 URL，兼容结尾带/不带斜杠两种写法 */
export function buildUpstreamUrl(baseUrl, endpoint) {
  const base = baseUrl || DEFAULT_AI_API_URL;
  return base.endsWith('/') ? base + endpoint : `${base}/${endpoint}`;
}

/**
 * 从最近日志中构造反重复参考历史。
 * 优先使用请求体传入的快照，缺失时回落到服务端已存日志。
 */
export function resolveRecentLogs(user, recentLogs, limit = 10) {
  if (Array.isArray(recentLogs) && recentLogs.length > 0) return recentLogs;
  if (!user || !user.logs) return [];

  return Object.entries(user.logs)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([date, item]) => ({ date, title: item.title, content: item.content }));
}

/**
 * 调用上游 chat/completions。
 *
 * 不抛异常，统一返回结构化结果，由调用方决定失败策略
 * （/directions 走本地场景库兜底，/generate 需要 routeInfo，/weekly 只需文案）：
 *   { ok: true,  data }
 *   { ok: false, kind: 'http',    status, errorData, upstreamMessage, retryAfter }
 *   { ok: false, kind: 'network', status: 0, timeout, upstreamMessage }
 */
export async function callChatCompletion({
  apiKey,
  apiUrl,
  model,
  systemPrompt,
  userPrompt,
  temperature = 0.8,
  maxTokens = 1500,
  timeoutMs = UPSTREAM_TIMEOUT_MS
}) {
  let response;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  if (isOpenRouterApiUrl(apiUrl)) {
    headers['HTTP-Referer'] = 'https://deeix.com';
    headers['X-Title'] = 'Winner Daily';
  }

  try {
    response = await fetch(buildUpstreamUrl(apiUrl, 'chat/completions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || DEFAULT_AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const timeout = error.name === 'TimeoutError' || String(error.message || '').includes('timeout');
    return {
      ok: false,
      kind: 'network',
      status: 0,
      timeout,
      upstreamMessage: timeout
        ? `上游模型供应商轮询响应超时（已等待 ${Math.round(timeoutMs / 1000)} 秒未返回），请稍后再试或切换其他模型通道。`
        : (error.message || '上游接口请求失败')
    };
  }

  if (!response.ok) {
    const errText = await response.text();
    let errorData = errText;
    try {
      errorData = JSON.parse(errText);
    } catch (e) { /* 上游返回非 JSON，保留原文 */ }

    const upstreamMessage = typeof errorData === 'string'
      ? errorData
      : (errorData?.error?.message || errorData?.message || errText);

    return {
      ok: false,
      kind: 'http',
      status: response.status,
      errorData,
      upstreamMessage,
      retryAfter: response.headers.get('retry-after')
    };
  }

  return { ok: true, data: await response.json() };
}

/** 拉取上游可用模型列表（GET /models） */
export async function fetchUpstreamModels({ apiKey, apiUrl, timeoutMs = MODELS_TIMEOUT_MS }) {
  let response;
  try {
    response = await fetch(buildUpstreamUrl(apiUrl, 'models'), {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    const timeout = error.name === 'TimeoutError';
    return {
      ok: false,
      upstreamMessage: timeout ? '拉取模型列表超时，请检查上游地址与网络。' : (error.message || '拉取模型列表失败')
    };
  }

  if (!response.ok) {
    return { ok: false, upstreamMessage: `获取模型列表失败: ${response.status}` };
  }

  return { ok: true, data: await response.json() };
}

/** 从上游返回的原始模型条目中判定是否免费 */
export function isFreeModel(item) {
  if (typeof item.id === 'string' && (item.id.includes(':free') || item.id.includes('-free'))) return true;
  return !!(item.pricing && Number(item.pricing.prompt) === 0 && Number(item.pricing.completion) === 0);
}
