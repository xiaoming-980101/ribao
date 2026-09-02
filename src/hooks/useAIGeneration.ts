import { useState, useEffect, useCallback, useRef } from 'react';
import { RouteInfo, CompareResult, DirectionOption } from '../types/ai';
import {
  ModelOption,
  BACKEND_URL,
  getUserAISettings,
  saveUserAISettings,
  loadCachedModels,
  saveCachedModels,
  saveSettings,
  isOpenRouterApiUrl,
  DEFAULT_AI_API_URL,
  DEFAULT_AI_MODEL,
  fetchAIDirections,
  getCurrentUser
} from '../utils/storage';
import {
  normalizeModelId,
  buildDefaultCompareModels,
  buildFallbackQueue,
  formatSelectedModel,
  classifyGenerateError,
  formatErrorReason,
  getDefaultModelOptions,
  LEGACY_INVALID_MODELS
} from '../utils/modelHelpers';
import { generateAIPrompt, generateLocalDirectionSuggestions, generateRandomFrontendDaily } from '../utils/generator';

interface UseAIGenerationProps {
  appData: any;
  userInput: string;
  job: string;
  customJobName: string;
  tone: string;
  mode: 'task' | 'idle' | 'study' | 'ai_prompt';
  selectedDate: string;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
  
  setTitle: (t: string) => void;
  setHours: (h: number) => void;
  setCooperation: (c: boolean) => void;
  setDifficulty: (d: boolean) => void;
  setContent: (c: string) => void;
  setSessionHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useAIGeneration({
  appData,
  userInput,
  job,
  customJobName,
  tone,
  mode,
  selectedDate: _selectedDate,
  onSaveSuccess,
  showToast,
  onNavigateToTab,
  setTitle,
  setHours,
  setCooperation,
  setDifficulty,
  setContent,
  setSessionHistory
}: UseAIGenerationProps) {
  const [aiSettings, setAiSettings] = useState({
    aiEnabled: false,
    aiApiKey: '',
    aiApiUrl: DEFAULT_AI_API_URL,
    aiModel: DEFAULT_AI_MODEL
  });
  const [lastRouteInfo, setLastRouteInfo] = useState<RouteInfo | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareModels, setCompareModels] = useState<string[]>([]);
  const [compareResults, setCompareResults] = useState<CompareResult[]>([]);
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);

  // ── 请求取消与防重入（AbortController + generatingRef）──
  const activeAbortRef = useRef<AbortController | null>(null);
  const generatingRef = useRef<boolean>(false);

  // 组件卸载时取消所有进行中的生成请求
  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
    };
  }, []);

  // 发起新一轮生成前，先取消旧请求
  const beginGenerationSignal = useCallback(() => {
    activeAbortRef.current?.abort();
    const ctrl = new AbortController();
    activeAbortRef.current = ctrl;
    return ctrl.signal;
  }, []);

  // 供外部（如切换模型/页面）主动取消当前生成
  const cancelGenerate = useCallback(() => {
    activeAbortRef.current?.abort();
  }, []);

  // ── 方向罗盘状态 ──
  const [directions, setDirections] = useState<DirectionOption[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(null);
  const [isFetchingDirections, setIsFetchingDirections] = useState<boolean>(false);
  const [customDirectionNote, setCustomDirectionNote] = useState<string>('');

  const loadAISettings = useCallback(() => {
    const localAISettings = getUserAISettings();
    const cloudSavePref = appData.settings?.saveKeyToCloud !== undefined ? appData.settings.saveKeyToCloud : true;
    const resolvedApiUrl = localAISettings.aiApiUrl || appData.settings?.aiApiUrl || DEFAULT_AI_API_URL;
    const rawModel = localAISettings.aiModel || appData.settings?.aiModel || (isOpenRouterApiUrl(resolvedApiUrl) ? DEFAULT_AI_MODEL : '');
    const resolvedModel = normalizeModelId(rawModel, resolvedApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
    
    if ((localAISettings.aiModel && localAISettings.aiModel !== resolvedModel) || (appData.settings?.aiModel && appData.settings.aiModel !== resolvedModel)) {
      saveUserAISettings({ aiModel: resolvedModel });
    }
    
    setAiSettings({
      aiEnabled: localAISettings.aiEnabled !== undefined ? !!localAISettings.aiEnabled : (appData.settings?.aiEnabled || false),
      aiApiKey: cloudSavePref ? (appData.settings?.aiApiKey || localAISettings.aiApiKey || '') : (localAISettings.aiApiKey || ''),
      aiApiUrl: resolvedApiUrl,
      aiModel: resolvedModel
    });
  }, [appData.settings]);

  useEffect(() => {
    loadAISettings();
  }, [loadAISettings]);

  useEffect(() => {
    const refreshFromStorage = () => loadAISettings();
    window.addEventListener('focus', refreshFromStorage);
    window.addEventListener('storage', refreshFromStorage);
    window.addEventListener('winner-daily-settings-updated', refreshFromStorage);
    return () => {
      window.removeEventListener('focus', refreshFromStorage);
      window.removeEventListener('storage', refreshFromStorage);
      window.removeEventListener('winner-daily-settings-updated', refreshFromStorage);
    };
  }, [loadAISettings]);

  useEffect(() => {
    setLastRouteInfo(null);
  }, [aiSettings.aiModel]);

  useEffect(() => {
    if (compareModels.length === 0) {
      setCompareModels(buildDefaultCompareModels(aiSettings.aiModel, modelList, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl));
    }
  }, [aiSettings.aiModel, aiSettings.aiApiUrl, compareModels.length, modelList]);

  useEffect(() => {
    const allowedModels = new Set([
      aiSettings.aiModel,
      ...modelList.map((model) => model.id),
      ...getDefaultModelOptions(aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl).map((model) => model.id)
    ].filter(Boolean));

    setCompareModels((prev) => {
      const filtered = prev
        .map((modelId) => normalizeModelId(modelId, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl))
        .filter((modelId) => allowedModels.has(modelId) && !LEGACY_INVALID_MODELS.has(modelId));

      if (filtered.length > 0) return Array.from(new Set(filtered)).slice(0, 3);
      return buildDefaultCompareModels(aiSettings.aiModel, modelList, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
    });
  }, [aiSettings.aiApiUrl, aiSettings.aiModel, modelList]);

  useEffect(() => {
    setModelList(loadCachedModels(aiSettings.aiApiUrl) || getDefaultModelOptions(aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl));
  }, [aiSettings.aiApiUrl]);

  // ── 拉取工作方向建议 ──
  const fetchDirections = useCallback(async (_forceOnline: boolean = false) => {
    if (mode !== 'idle' && mode !== 'study') return;
    setIsFetchingDirections(true);

    const historyLogs = Object.entries(appData.logs || {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([date, item]: [string, any]) => ({
        date,
        title: item.title,
        content: item.content
      }));

    try {
      const res = await fetchAIDirections({
        job,
        customJobName,
        mode,
        recentLogs: historyLogs,
        aiApiKey: aiSettings.aiApiKey,
        aiApiUrl: aiSettings.aiApiUrl,
        aiModel: aiSettings.aiModel
      });

      if (res.success && res.directions && res.directions.length > 0) {
        setDirections(res.directions);
        setSelectedDirectionId(res.directions[0].id);
      }
    } catch (e) {
      console.warn('获取方向建议异常，使用本地默认:', e);
      const local = generateLocalDirectionSuggestions(job, mode, customJobName, historyLogs);
      setDirections(local);
      if (local.length > 0) setSelectedDirectionId(local[0].id);
    } finally {
      setIsFetchingDirections(false);
    }
  }, [mode, job, customJobName, appData.logs, aiSettings.aiApiKey, aiSettings.aiApiUrl, aiSettings.aiModel]);

  // 当处于无任务/技术预研模式，且岗位或模式变化时，自动拉取 5 个切入点方向
  useEffect(() => {
    if (mode === 'idle' || mode === 'study') {
      fetchDirections();
    }
  }, [mode, job, customJobName, fetchDirections]);

  const selectedDirection = directions.find((d) => d.id === selectedDirectionId) || null;

  const selectDirection = (id: string) => {
    setSelectedDirectionId(id);
  };

  const handleQuickChangeModel = async (newModel: string) => {
    // 切换模型时取消进行中的生成请求，避免旧请求覆盖新选择
    cancelGenerate();
    const normalizedModel = normalizeModelId(newModel, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
    const nextSettings = { ...aiSettings, aiModel: normalizedModel };
    setAiSettings(nextSettings);
    setLastRouteInfo(null);
    saveUserAISettings(nextSettings);
    try {
      await saveSettings({
        aiEnabled: nextSettings.aiEnabled,
        aiApiUrl: nextSettings.aiApiUrl,
        aiModel: nextSettings.aiModel
      });
      onSaveSuccess();
    } catch (e) {
      console.warn('在线保存配置失败，已保存至本地');
    }
  };

  const toggleCompareModel = (modelId: string) => {
    const normalizedModelId = normalizeModelId(modelId, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
    setCompareModels((prev) => {
      const exists = prev.includes(normalizedModelId);
      if (exists) {
        if (prev.length <= 1) {
          showToast('对比模式至少保留 1 个模型！', 'info');
          return prev;
        }
        return prev.filter((m) => m !== normalizedModelId);
      } else {
        if (prev.length >= 3) {
          showToast('多模型对比最多支持同时对比 3 个模型！', 'info');
          return prev;
        }
        return [...prev, normalizedModelId];
      }
    });
  };

  const applyCompareResult = (result: CompareResult) => {
    if (!result.content) return;
    setTitle(result.title || '日常日志');
    setHours(8);
    setCooperation(userInput.includes('对接') || userInput.includes('联调') || userInput.includes('走查') || userInput.includes('切图'));
    setDifficulty(userInput.includes('bug') || userInput.includes('重构') || userInput.includes('走查'));
    setContent(result.content);
    if (result.routeInfo) {
      setLastRouteInfo({ ...result.routeInfo, status: 'success' });
    }
    setSessionHistory((prev) => {
      const next = [...prev, result.content!];
      if (next.length > 8) next.shift();
      return next;
    });
    showToast(`已应用 [${formatSelectedModel(result.requestedModel)}] 的生成结果！`, 'success');
  };

  const refreshAvailableModels = async () => {
    if (!aiSettings.aiApiKey) {
      showToast('请先配置 API 密钥，以便从服务商拉取完整模型列表！', 'error');
      if (onNavigateToTab) onNavigateToTab('settings');
      return;
    }
    showToast('正在从大模型上游同步支持的模型列表...', 'info');
    try {
      const user = getCurrentUser();
      const res = await fetch(`${BACKEND_URL}/api/ai/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': user
        },
        body: JSON.stringify({
          aiApiKey: aiSettings.aiApiKey,
          aiApiUrl: aiSettings.aiApiUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setModelList(data.models);
          saveCachedModels(data.models, aiSettings.aiApiUrl);
          showToast(`成功同步 ${data.models.length} 个大模型！`, 'success');
          return;
        }
      }
      throw new Error('服务商未返回可用模型列表');
    } catch (e: any) {
      showToast(`同步模型列表失败: ${e.message || '网络连接超时'}`, 'error');
    }
  };

  const requestGenerate = async (targetModel: string, overrides: any = {}, signal?: AbortSignal) => {
    const user = getCurrentUser();
    const historyLogs = Object.entries(appData.logs || {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([date, item]: [string, any]) => ({
        date,
        title: item.title,
        content: item.content
      }));

    // 组合输入：如果是无任务/技术预研模式，若选定了方向卡片，则将精准方向注入作为核心输入
    let effectiveInput = userInput;
    if (mode === 'idle' || mode === 'study') {
      if (selectedDirection) {
        const noteStr = customDirectionNote.trim() ? `（细节补充：${customDirectionNote.trim()}）` : '';
        effectiveInput = `${selectedDirection.title}：${selectedDirection.summary}${noteStr}`;
      }
    }

    const payload = {
      userInput: effectiveInput,
      job,
      customJobName: job === 'custom' ? customJobName : '',
      tone,
      mode,
      recentLogs: historyLogs,
      aiApiKey: aiSettings.aiApiKey,
      aiApiUrl: aiSettings.aiApiUrl,
      aiModel: targetModel,
      ...overrides
    };

    // 合并外部取消信号与 180s 超时信号
    const timeoutSignal = AbortSignal.timeout(180000);
    const combinedSignal = signal
      ? (typeof AbortSignal.any === 'function'
        ? AbortSignal.any([signal, timeoutSignal])
        : signal) // 老环境无 AbortSignal.any 时退回仅外部信号
      : timeoutSignal;

    const res = await fetch(`${BACKEND_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': user
      },
      body: JSON.stringify(payload),
      signal: combinedSignal
    });

    const resText = await res.text();
    let resData: any = resText;
    try {
      resData = JSON.parse(resText);
    } catch (_err) {
      // Upstream did not return valid JSON, keep raw text
    }

    if (!res.ok) {
      const errorMsg = typeof resData === 'string' ? resData : (resData?.error || `生成请求失败: ${res.status}`);
      const errorObj: any = new Error(errorMsg);
      errorObj.statusCode = res.status;
      errorObj.routeInfo = resData?.routeInfo;
      throw errorObj;
    }

    return resData;
  };

  const handleGenerate = async (overrides: any = {}) => {
    // 防重入：上一次生成仍在进行时忽略本次触发（Ctrl+Enter 连按、双击等场景）
    if (generatingRef.current) {
      showToast('上一次生成仍在进行中，请稍候…', 'info');
      return;
    }

    if (mode === 'ai_prompt') {
      // 豆包提示词生成
      const effectiveInput = userInput.trim() || (selectedDirection ? `${selectedDirection.title}：${selectedDirection.summary}` : '');
      const prompt = generateAIPrompt(effectiveInput, job, customJobName, tone);
      setTitle('复制提示词到豆包生成');
      setHours(8);
      setCooperation(false);
      setDifficulty(false);
      setContent(prompt);
      showToast('格式化 Markdown 事项模板已生成完毕！', 'success');
      return;
    }

    // 离线模式 / 未开启 AI
    if (!aiSettings.aiEnabled || !aiSettings.aiApiKey) {
      if (mode === 'idle' || mode === 'study') {
        const directionTitle = selectedDirection ? selectedDirection.title : '';
        const result = generateRandomFrontendDaily('', mode === 'study', job, customJobName);
        if (directionTitle) {
          result.title = directionTitle;
        }
        setTitle(result.title);
        setHours(result.hours);
        setCooperation(result.cooperation);
        setDifficulty(result.difficulty);
        setContent(result.content);
        showToast('已基于选定维护事项完成格式化归档！', 'success');
      } else {
        const result = generateRandomFrontendDaily('', false, job, customJobName);
        setTitle(result.title);
        setHours(result.hours);
        setCooperation(result.cooperation);
        setDifficulty(result.difficulty);
        setContent(result.content);
        showToast('工作事项已整理并载入！', 'success');
      }
      return;
    }

    // 在线大模型模式
    if (compareMode) {
      if (compareModels.length === 0) {
        showToast('请至少选择一个模型进行对比！', 'error');
        return;
      }
      generatingRef.current = true;
      const runSignal = beginGenerationSignal();
      setGenerating(true);
      setCompareResults([]);
      showToast(`正在并行调用 ${compareModels.length} 个大模型生成对比结果...`, 'info');

      try {
        const promises = compareModels.map(async (modelId) => {
          try {
            const resData = await requestGenerate(modelId, overrides, runSignal);
            if (runSignal.aborted) return { id: modelId, requestedModel: modelId, aborted: true } as any;
            return {
              id: modelId,
              requestedModel: modelId,
              title: resData.title,
              content: resData.content,
              routeInfo: resData.routeInfo ? { ...resData.routeInfo, status: 'success' } : { requestedModel: modelId, actualModel: modelId, status: 'success' }
            } as CompareResult;
          } catch (err: any) {
            if (runSignal.aborted || err?.name === 'AbortError') {
              return { id: modelId, requestedModel: modelId, aborted: true } as any;
            }
            return {
              id: modelId,
              requestedModel: modelId,
              error: err.message || '请求失败',
              routeInfo: err.routeInfo ? { ...err.routeInfo, requestedModel: err.routeInfo.requestedModel || modelId, status: 'error', statusCode: err.statusCode || err.routeInfo.statusCode, errorType: err.routeInfo.errorType || classifyGenerateError(err.message, err.statusCode) } : { requestedModel: modelId, actualModel: modelId, status: 'error', statusCode: err.statusCode, errorType: classifyGenerateError(err.message, err.statusCode) }
            } as CompareResult;
          }
        });

        const results = await Promise.all(promises);
        if (runSignal.aborted) return;   // 本轮已被取消（切换模型/卸载），丢弃过期结果
        const validResults = results.filter((r: any) => !r.aborted);
        setCompareResults(validResults);

        const successCount = validResults.filter((r: any) => !r.error && r.content).length;
        if (successCount > 0) {
          showToast(`多方案比对完成：成功 ${successCount} 个，失败 ${validResults.length - successCount} 个`, 'success');
        } else {
          showToast('所有对比模型请求均未成功，请检查网络或 API 密钥', 'error');
        }
      } finally {
        generatingRef.current = false;
        setGenerating(false);
      }
    } else {
      // 单模型生成 + 自动重试降级链
      generatingRef.current = true;
      const runSignal = beginGenerationSignal();
      setGenerating(true);
      try {
        const fallbackQueue = buildFallbackQueue(aiSettings.aiModel, modelList, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
        let lastError: any = null;

        if (fallbackQueue.length === 0) {
          showToast('当前没有可用的模型 ID，请先在模型列表选择或输入模型。', 'error');
          setGenerating(false);
          return;
        }

        for (let attemptIndex = 0; attemptIndex < fallbackQueue.length; attemptIndex++) {
          const modelToTry = fallbackQueue[attemptIndex];
          try {
            if (attemptIndex > 0 && !runSignal.aborted) {
              showToast(`正在切换到降级模型 [${formatSelectedModel(modelToTry)}] 重试生成...`, 'info');
            }
            const resData = await requestGenerate(modelToTry, overrides, runSignal);
            if (runSignal.aborted) return;    // 本轮已被取消，丢弃结果
            if (resData.success && resData.content) {
              setTitle(resData.title || '日常日志');
              setHours(8);
              setCooperation(userInput.includes('对接') || userInput.includes('联调') || userInput.includes('走查') || userInput.includes('切图'));
              setDifficulty(userInput.includes('bug') || userInput.includes('重构') || userInput.includes('走查'));
              setContent(resData.content);
              const routeInfo: RouteInfo = resData.routeInfo
                ? { ...resData.routeInfo, status: 'success' }
                : { requestedModel: modelToTry, actualModel: modelToTry, status: 'success' };
              setLastRouteInfo(routeInfo);
              setSessionHistory((prev) => {
                const next = [...prev, resData.content];
                if (next.length > 8) next.shift();
                return next;
              });
              showToast(`工作事项已通过 [${formatSelectedModel(modelToTry)}] 整理排版完毕！`, 'success');
              lastError = null;
              break;
            }
          } catch (error: any) {
            if (runSignal.aborted || error?.name === 'AbortError') return;   // 用户取消/切换模型，静默退出
            lastError = error;
            const routeInfo: RouteInfo = error.routeInfo
              ? { ...error.routeInfo, requestedModel: error.routeInfo.requestedModel || modelToTry, status: 'error', statusCode: error.statusCode || error.routeInfo.statusCode, errorType: error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode) }
              : { requestedModel: modelToTry, actualModel: modelToTry, status: 'error', statusCode: error.statusCode, errorType: classifyGenerateError(error.message, error.statusCode) };
            setLastRouteInfo(routeInfo);
            if (attemptIndex < fallbackQueue.length - 1) {
              showToast(`${formatSelectedModel(modelToTry)} ${formatErrorReason(error.message, routeInfo)}，正在自动降级重试...`, 'info');
            }
          }
        }

        if (lastError && !runSignal.aborted) {
          showToast(`生成失败：${lastError.message || '全部降级模型均不可用'}`, 'error');
        }
      } finally {
        generatingRef.current = false;
        setGenerating(false);
      }
    }
  };

  return {
    aiSettings,
    lastRouteInfo,
    compareMode,
    setCompareMode,
    compareModels,
    setCompareModels,
    compareResults,
    setCompareResults,
    modelList,
    isDropdownOpen,
    setIsDropdownOpen,
    searchQuery,
    setSearchQuery,
    generating,
    handleQuickChangeModel,
    toggleCompareModel,
    applyCompareResult,
    refreshAvailableModels,
    cancelGenerate,
    handleGenerate,
    
    // 方向罗盘导出
    directions,
    selectedDirectionId,
    selectedDirection,
    selectDirection,
    isFetchingDirections,
    fetchDirections,
    customDirectionNote,
    setCustomDirectionNote
  };
}
