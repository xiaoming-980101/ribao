import { useState, useEffect } from 'react';
import { RouteInfo, CompareResult } from '../types/ai';
import {
  ModelOption,
  BACKEND_URL,
  getCurrentUser,
  getUserAISettings,
  saveUserAISettings,
  loadCachedModels,
  saveCachedModels,
  saveSettings,
  isOpenRouterApiUrl,
  DEFAULT_AI_API_URL,
  DEFAULT_AI_MODEL
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
import { generateAIPrompt } from '../utils/generator';

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
  selectedDate,
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

  const loadAISettings = () => {
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
  };

  useEffect(() => {
    loadAISettings();
  }, [appData.settings]);

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
  }, [appData.settings]);

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

  const handleQuickChangeModel = async (newModel: string) => {
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
      console.error('静默保存快捷模型失败:', e);
    }
    showToast(`🎯 已快捷切换大模型为: ${formatSelectedModel(normalizedModel)}`, 'success');
  };

  const toggleCompareModel = (modelId: string) => {
    setCompareModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.length > 1 ? prev.filter((id) => id !== modelId) : prev;
      }
      if (prev.length >= 3) {
        showToast('最多同时对比 3 个模型，可以先取消一个再选择。', 'info');
        return prev;
      }
      return [...prev, modelId];
    });
  };

  const applyCompareResult = (result: CompareResult) => {
    if (!result.title || !result.content) return;
    setTitle(result.title);
    setHours(8);
    setCooperation(userInput.includes('对接') || userInput.includes('联调') || userInput.includes('走查') || userInput.includes('切图'));
    setDifficulty(userInput.includes('bug') || userInput.includes('重构') || userInput.includes('走查'));
    setContent(result.content);
    if (result.routeInfo) setLastRouteInfo({ ...result.routeInfo, status: 'success' });
    setSessionHistory((prev) => {
      const next = [...prev, result.content || ''];
      if (next.length > 8) next.shift();
      return next;
    });
    showToast(`已采用 ${formatSelectedModel(result.requestedModel)} 的候选日报。`, 'success');
  };

  const hasUsableFreeModels = (models: ModelOption[]) => models.some((model) =>
    model.isFree && model.id !== DEFAULT_AI_MODEL && !LEGACY_INVALID_MODELS.has(model.id)
  );

  const refreshAvailableModels = async () => {
    if (!aiSettings.aiApiKey) return modelList;

    try {
      const response = await fetch(`${BACKEND_URL}/api/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': getCurrentUser()
        },
        body: JSON.stringify({
          aiApiKey: aiSettings.aiApiKey,
          aiApiUrl: aiSettings.aiApiUrl
        })
      });

      if (!response.ok) return modelList;
      const resData = await response.json();
      if (!resData.success || !Array.isArray(resData.models)) return modelList;

      const cleanedModels: ModelOption[] = resData.models
        .filter((model: ModelOption) => model?.id && !LEGACY_INVALID_MODELS.has(model.id));
      const mergedModels = [
        ...getDefaultModelOptions(aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl),
        ...cleanedModels.filter((model) => model.id !== DEFAULT_AI_MODEL)
      ];
      setModelList(mergedModels);
      saveCachedModels(mergedModels, aiSettings.aiApiUrl);
      return mergedModels;
    } catch (error) {
      console.warn('自动刷新可用模型列表失败:', error);
      return modelList;
    }
  };

  const requestGenerate = async (modelToTry: string, overrides: Record<string, any> = {}) => {
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': getCurrentUser()
      },
      body: JSON.stringify({
        userInput,
        job,
        customJobName,
        tone,
        mode,
        aiApiKey: aiSettings.aiApiKey,
        aiApiUrl: aiSettings.aiApiUrl,
        aiModel: modelToTry,
        ...overrides
      })
    });

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch (e) {
        errData = { error: '联调接口请求失败' };
      }
      const requestError: any = new Error(errData.error || '联调接口请求失败');
      requestError.statusCode = response.status;
      requestError.routeInfo = {
        ...(errData.routeInfo || { requestedModel: modelToTry }),
        statusCode: response.status,
        errorType: errData.routeInfo?.errorType || classifyGenerateError(errData.error || '联调接口请求失败', response.status)
      };
      throw requestError;
    }

    return response.json();
  };

  const prepareFallbackQueue = async () => {
    let availableModels = modelList;
    if (!hasUsableFreeModels(availableModels)) {
      showToast('🔄 正在刷新当前 Key 可用的免费模型列表...', 'info');
      availableModels = await refreshAvailableModels();
    }
    return buildFallbackQueue(aiSettings.aiModel, availableModels, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl);
  };

  const handleGenerate = async (overrides: Record<string, any> = {}) => {
    if (mode === 'ai_prompt') {
      const fallbackPrompt = generateAIPrompt(userInput, job, customJobName, tone);
      setTitle('从大模型复制结果粘贴至此');
      setHours(8);
      setCooperation(false);
      setDifficulty(false);
      setContent(fallbackPrompt);

      if (!aiSettings.aiEnabled || !aiSettings.aiApiKey) {
        showToast('📋 已生成本地内置 Prompt，请点击下方按钮复制并前往豆包。', 'info');
        return;
      }

      setGenerating(true);
      setLastRouteInfo(null);
      let selectedPrompt = fallbackPrompt;
      let promptGeneratedByAI = false;

      try {
        const fallbackQueue = await prepareFallbackQueue();
        if (fallbackQueue.length === 0) {
          showToast('⚠️ 当前上游没有可用模型，已改用本地内置 Prompt。', 'info');
        }

        for (let attemptIndex = 0; attemptIndex < fallbackQueue.length; attemptIndex++) {
          const modelToTry = fallbackQueue[attemptIndex];
          try {
            showToast(
              attemptIndex === 0
                ? `🤖 正在用大模型 [${formatSelectedModel(modelToTry)}] 生成豆包 Prompt...`
                : `🔁 正在切换到 [${formatSelectedModel(modelToTry)}] 重试生成 Prompt...`,
              'info'
            );
            const resData = await requestGenerate(modelToTry, { mode: 'doubao_prompt', ...overrides });
            if (resData.success && resData.content) {
              selectedPrompt = resData.content;
              promptGeneratedByAI = true;
              const routeInfo: RouteInfo = resData.routeInfo
                ? { ...resData.routeInfo, status: 'success' }
                : { requestedModel: modelToTry, actualModel: modelToTry, status: 'success' };
              setLastRouteInfo(routeInfo);
              break;
            }
          } catch (error: any) {
            const routeInfo: RouteInfo = error.routeInfo
              ? { ...error.routeInfo, requestedModel: error.routeInfo.requestedModel || modelToTry, status: 'error', statusCode: error.statusCode || error.routeInfo.statusCode, errorType: error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode) }
              : { requestedModel: modelToTry, actualModel: modelToTry, status: 'error', statusCode: error.statusCode, errorType: classifyGenerateError(error.message, error.statusCode) };
            setLastRouteInfo(routeInfo);
            if (attemptIndex < fallbackQueue.length - 1) {
              showToast(`⚠️ ${formatSelectedModel(modelToTry)} ${formatErrorReason(error.message, routeInfo)}，正在尝试下一个模型...`, 'info');
            }
          }
        }
      } finally {
        setGenerating(false);
      }

      setContent(selectedPrompt);
      showToast(
        promptGeneratedByAI
          ? '📋 大模型 Prompt 已生成完成，请点击下方按钮复制并前往豆包。'
          : '📋 大模型不可用，已生成本地内置 Prompt，请点击下方按钮复制并前往豆包。',
        promptGeneratedByAI ? 'success' : 'info'
      );
      return;
    }

    if (aiSettings.aiEnabled) {
      if (!aiSettings.aiApiKey) {
        showToast('⚠️ 已开启 AI 模式，但尚未配置 API Key！请前往《个性化配置》填写您的 OpenRouter Key。', 'error');
        if (onNavigateToTab) onNavigateToTab('settings');
        return;
      }
      setGenerating(true);
      setLastRouteInfo(null);
      const fallbackQueue = await prepareFallbackQueue();
      if (fallbackQueue.length === 0) {
        setGenerating(false);
        showToast('⚠️ 当前上游没有可用模型，请先在《个性化配置》同步模型列表或手动填写真实模型 ID。', 'error');
        if (onNavigateToTab) onNavigateToTab('settings');
        return;
      }
      showToast(`🤖 正在联调大模型 [${formatSelectedModel(fallbackQueue[0])}] 生成日报...`, 'info');
      let lastError: any = null;

      try {
        if (compareMode) {
          const sourceModels = compareModels.length > 0 ? compareModels : fallbackQueue;
          const selectedModels = Array.from(
            new Set(
              sourceModels
                .map((modelId) => normalizeModelId(modelId, aiSettings.aiApiUrl, DEFAULT_AI_MODEL, isOpenRouterApiUrl))
                .filter((modelId) => !LEGACY_INVALID_MODELS.has(modelId))
            )
          ).slice(0, 3);
          
          setCompareResults([]);
          showToast(`🧪 正在同时对比 ${selectedModels.length} 个模型，请稍候...`, 'info');

          const settledResults = await Promise.allSettled(
            selectedModels.map(async (modelToTry, index) => {
              const resData = await requestGenerate(modelToTry, overrides);
              if (!resData.success) {
                throw new Error('模型返回失败');
              }
              const routeInfo: RouteInfo = resData.routeInfo
                ? { ...resData.routeInfo, status: 'success' }
                : { requestedModel: modelToTry, actualModel: modelToTry, status: 'success' };
              return {
                id: `${modelToTry}-${index}-${Date.now()}`,
                requestedModel: modelToTry,
                title: resData.title,
                content: resData.content,
                routeInfo
              } as CompareResult;
            })
          );

          const results: CompareResult[] = settledResults.map((result, index) => {
            const requestedModel = selectedModels[index];
            if (result.status === 'fulfilled') {
              return result.value;
            }
            const reason: any = result.reason;
            const routeInfo: RouteInfo = reason?.routeInfo
              ? { ...reason.routeInfo, requestedModel: reason.routeInfo.requestedModel || requestedModel, status: 'error', statusCode: reason.statusCode || reason.routeInfo.statusCode, errorType: reason.routeInfo.errorType || classifyGenerateError(reason.message, reason.statusCode) }
              : { requestedModel, actualModel: requestedModel, status: 'error', statusCode: reason.statusCode, errorType: classifyGenerateError(reason.message, reason.statusCode) };
            return {
              id: `${requestedModel}-${index}-${Date.now()}`,
              requestedModel,
              error: reason.message || '模型返回错误',
              routeInfo
            } as CompareResult;
          });

          setCompareResults(results);
          const successCount = results.filter((r) => !r.error).length;
          if (successCount > 0) {
            const firstSuccess = results.find((r) => !r.error);
            if (firstSuccess && firstSuccess.title && firstSuccess.content) {
              setTitle(firstSuccess.title);
              setHours(8);
              setCooperation(userInput.includes('对接') || userInput.includes('联调') || userInput.includes('走查') || userInput.includes('切图'));
              setDifficulty(userInput.includes('bug') || userInput.includes('重构') || userInput.includes('走查'));
              setContent(firstSuccess.content);
              if (firstSuccess.routeInfo) setLastRouteInfo(firstSuccess.routeInfo);
              setSessionHistory((prev) => {
                const next = [...prev, firstSuccess.content || ''];
                if (next.length > 8) next.shift();
                return next;
              });
            }
            showToast(`🧪 对比生成完成！已加载首个成功大模型 [${formatSelectedModel(firstSuccess?.requestedModel || '')}] 结果，您可在右下角切换对比。`, 'success');
          } else {
            showToast('❌ 所有对比模型全部请求失败，请核对网络或 API 密钥！', 'error');
          }
          return;
        }

        for (let attemptIndex = 0; attemptIndex < fallbackQueue.length; attemptIndex++) {
          const modelToTry = fallbackQueue[attemptIndex];
          try {
            if (attemptIndex > 0) {
              showToast(`🔁 正在切换到降级模型 [${formatSelectedModel(modelToTry)}] 重试生成...`, 'info');
            }
            const resData = await requestGenerate(modelToTry, overrides);
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
              showToast(`🎉 日报已通过 [${formatSelectedModel(modelToTry)}] 生成完毕！`, 'success');
              lastError = null;
              break;
            }
          } catch (error: any) {
            lastError = error;
            const routeInfo: RouteInfo = error.routeInfo
              ? { ...error.routeInfo, requestedModel: error.routeInfo.requestedModel || modelToTry, status: 'error', statusCode: error.statusCode || error.routeInfo.statusCode, errorType: error.routeInfo.errorType || classifyGenerateError(error.message, error.statusCode) }
              : { requestedModel: modelToTry, actualModel: modelToTry, status: 'error', statusCode: error.statusCode, errorType: classifyGenerateError(error.message, error.statusCode) };
            setLastRouteInfo(routeInfo);
            if (attemptIndex < fallbackQueue.length - 1) {
              showToast(`⚠️ ${formatSelectedModel(modelToTry)} ${formatErrorReason(error.message, routeInfo)}，正在自动降级重试...`, 'info');
            }
          }
        }

        if (lastError) {
          showToast(`❌ 生成失败：${lastError.message || '全部降级模型均不可用'}`, 'error');
        }
      } finally {
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
    compareResults,
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
    handleGenerate
  };
}
