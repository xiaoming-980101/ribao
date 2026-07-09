import React, { useState, useEffect } from 'react';
import {
  AppData,
  saveLog,
  saveSettings,
  isOpenRouterApiUrl,
  DEFAULT_AI_API_URL,
  DEFAULT_AI_MODEL
} from '../utils/storage';
import {
  expandUserInput,
  generateRandomFrontendDaily,
  calculateSimilarity,
  getSimilarityLevel,
  getJobDisplayName
} from '../utils/generator';

import { useSimilarityCheck } from '../hooks/useSimilarityCheck';
import { useAIGeneration } from '../hooks/useAIGeneration';
import { InputPanel } from './daily/InputPanel';
import { PreviewPanel } from './daily/PreviewPanel';
import { AIModelControls } from './daily/AIModelControls';

import { copyTextToClipboard } from '../utils/clipboard';
import {
  checkIsRecommended,
  formatSelectedModel,
  formatRouteLabel,
  formatRouteTitle,
  buildDefaultCompareModels
} from '../utils/modelHelpers';

interface DailyGeneratorProps {
  appData: AppData;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

const DOUBAO_CHAT_URL = 'https://www.doubao.com/chat/';

export default function DailyGenerator({ appData, onSaveSuccess, showToast, onNavigateToTab }: DailyGeneratorProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [mode, setMode] = useState<'task' | 'idle' | 'study' | 'ai_prompt'>('task');
  const [userInput, setUserInput] = useState<string>('');
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);

  // 表单字段
  const [title, setTitle] = useState<string>('');
  const [hours, setHours] = useState<number>(8);
  const [cooperation, setCooperation] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');

  // 交互状态
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // 岗位和语气
  const [job, setJob] = useState<string>('frontend');
  const [customJobName, setCustomJobName] = useState<string>('');
  const [tone, setTone] = useState<string>('professional');

  // 查重 hook
  const { maxSimilarity, similarDate } = useSimilarityCheck({
    content,
    selectedDate,
    logs: appData.logs || {},
    sessionHistory
  });

  // AI 生成 hook
  const {
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
    handleGenerate
  } = useAIGeneration({
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
  });

  // 选项联动保存配置
  const handleJobChange = async (newJob: string) => {
    setJob(newJob);
    try {
      await saveSettings({ job: newJob, customJobName, tone });
      onSaveSuccess();
    } catch (e) {
      console.error('静默保存岗位失败:', e);
    }
  };

  const handleToneChange = async (newTone: string) => {
    setTone(newTone);
    try {
      await saveSettings({ job, customJobName, tone: newTone });
      onSaveSuccess();
    } catch (e) {
      console.error('静默保存语气失败:', e);
    }
  };

  const handleCustomJobNameBlur = async () => {
    try {
      await saveSettings({ job, customJobName: customJobName.trim(), tone });
      onSaveSuccess();
    } catch (e) {
      console.error('静默保存自定义岗位失败:', e);
    }
  };

  useEffect(() => {
    if (appData.settings) {
      setJob(appData.settings.job || 'frontend');
      setCustomJobName(appData.settings.customJobName || '');
      setTone(appData.settings.tone || 'professional');
    }
  }, [appData.settings]);

  // 初始化选择日期为今天
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // 自动加载该日期的日志
  useEffect(() => {
    if (selectedDate) {
      if (appData.logs[selectedDate]) {
        const existing = appData.logs[selectedDate];
        setTitle(existing.title);
        setHours(existing.hours);
        setCooperation(existing.cooperation);
        setDifficulty(existing.difficulty);
        setContent(existing.content);
      } else {
        setTitle('');
        setHours(8);
        setContent('');
        setCooperation(false);
        setDifficulty(false);
      }
    }
  }, [selectedDate, appData.logs]);

  // 快速选择日期
  const setQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // 本地碰撞防重生成
  const generateLocally = (jobType: string) => {
    let bestResult: any = null;
    let lowestSim = 100;

    for (let attempts = 0; attempts < 10; attempts++) {
      let tempResult: any;
      if (mode === 'task') {
        tempResult = expandUserInput(userInput + (attempts > 0 ? ` #${attempts}` : ''), jobType, customJobName);
      } else if (mode === 'idle') {
        tempResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, jobType, customJobName);
      } else {
        tempResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), true, jobType, customJobName);
      }

      let maxSim = 0;
      Object.entries(appData.logs).forEach(([date, log]) => {
        if (date === selectedDate) return;
        const sim = calculateSimilarity(tempResult.content, log.content);
        if (sim > maxSim) maxSim = sim;
      });
      sessionHistory.forEach((histContent) => {
        const sim = calculateSimilarity(tempResult.content, histContent);
        if (sim > maxSim) maxSim = sim;
      });

      if (maxSim < 30) {
        bestResult = tempResult;
        break;
      }

      if (maxSim < lowestSim) {
        lowestSim = maxSim;
        bestResult = tempResult;
      }
    }

    if (bestResult) {
      setTitle(bestResult.title);
      setHours(bestResult.hours);
      setCooperation(bestResult.cooperation);
      setDifficulty(bestResult.difficulty);
      setContent(bestResult.content);

      setSessionHistory((prev) => {
        const next = [...prev, bestResult.content];
        if (next.length > 8) next.shift();
        return next;
      });
    }
  };

  const tweakLocally = () => {
    if (mode === 'idle') {
      const result = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, job, customJobName);
      setContent(result.content);
    } else if (mode === 'study') {
      const result = generateRandomFrontendDaily(selectedDate + Math.random().toString(), true, job, customJobName);
      setContent(result.content);
    } else {
      const extraResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, job, customJobName);
      const extraLine = extraResult.content.split('\n')[0].replace(/^\d+\.\s*/, '');
      const currentLines = content.split('\n');
      if (currentLines.length > 0) {
        if (currentLines.length >= 2) {
          currentLines[currentLines.length - 1] = `${currentLines.length}. 日常系统维护：${extraLine}`;
        } else {
          currentLines.push(`2. 日常系统优化：${extraLine}`);
        }
        setContent(currentLines.join('\n'));
      }
    }
  };

  const handleTweakWrapper = async () => {
    if (!content.trim()) return;

    if (!aiSettings.aiEnabled || !aiSettings.aiApiKey || mode === 'ai_prompt') {
      tweakLocally();
      return;
    }
    await handleGenerate({
      mode: 'tweak',
      currentTitle: title,
      currentContent: content
    });
  };

  const handleGenerateWrapper = async () => {
    if (!aiSettings.aiEnabled || !aiSettings.aiApiKey) {
      generateLocally(job);
      return;
    }
    await handleGenerate();
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    const copied = await copyTextToClipboard(text);
    if (!copied) {
      showToast('复制失败，请手动选中内容复制。', 'error');
      return;
    }
    const fieldLabel = fieldName === 'title' ? '日志名称' : fieldName === 'all' ? '全套字段' : mode === 'ai_prompt' ? 'Prompt' : '日志内容';
    setCopiedField(fieldName);
    showToast(`${fieldLabel}已成功复制到剪贴板`, 'info');
    setTimeout(() => setCopiedField(null), 1500);
  };

  const copyAllFieldsText = () => {
    const text = `日志名称：${title}\n工时(h)：${hours}\n日志日期：${selectedDate}\n部门协作：${cooperation ? '是' : '否'}\n工作难点：${difficulty ? '是' : '否'}\n日志内容：\n${content}`;
    copyToClipboard(text, 'all');
  };

  const copyPromptAndOpenDoubao = async (
    prompt: string,
    successMessage: string,
    blockedMessage: string,
  ) => {
    const copyResult = copyTextToClipboard(prompt);
    const newWindow = window.open(DOUBAO_CHAT_URL, '_blank');
    const copied = await copyResult;

    if (newWindow) {
      showToast(copied ? successMessage : '已打开豆包新对话，请手动复制右侧 Prompt 后粘贴。', copied ? 'success' : 'info');
    } else {
      showToast(copied ? blockedMessage : '浏览器拦截了豆包窗口，请手动复制右侧 Prompt 后打开豆包。', 'info');
    }
    return copied;
  };

  const handleCopyPromptAndOpenDoubao = async (fieldName: string) => {
    const copied = await copyPromptAndOpenDoubao(
      content,
      'Prompt 已复制，并已打开豆包新对话，请粘贴后发送。',
      'Prompt 已复制；豆包窗口被拦截，请手动打开豆包粘贴。'
    );
    if (copied) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('日志名称和内容不能为空！', 'error');
      return;
    }

    if (maxSimilarity >= appData.settings.similarityThreshold) {
      const confirmSave = window.confirm(
        `⚠️ 考勤高危警告：\n\n当前日志内容与 [${similarDate}] 的历史日志相似度高达 ${maxSimilarity}%！\n这已超过了您在配置中设定的高危报警线 (${appData.settings.similarityThreshold}%)。\n\n如果直接提交，极易被公司考勤抽查判定为“敷衍、抄袭或重复填报”而导致扣绩效分。\n\n您确定要强行保存吗？`
      );
      if (!confirmSave) {
        return;
      }
    }

    setSaveStatus('saving');
    const logData = {
      title: title.trim(),
      hours: Number(hours),
      cooperation,
      difficulty,
      content: content.trim(),
      job,
      customJobName: customJobName.trim(),
      tone,
      isAutoGenerated: mode !== 'task'
    };

    const res = await saveLog(selectedDate, logData);
    if (res.success) {
      setSaveStatus('success');
      setSessionHistory((prev) => {
        const next = [...prev, content.trim()];
        if (next.length > 8) next.shift();
        return next;
      });
      showToast('🎉 日报已成功保存并物理落盘至 db.json！', 'success');
      onSaveSuccess();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      showToast('❌ 保存失败，请确认后端 API 服务已正常开启！', 'error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const simLevel = getSimilarityLevel(maxSimilarity, appData.settings.similarityThreshold);
  const isOpenRouterApi = isOpenRouterApiUrl(aiSettings.aiApiUrl);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>智能日报生成器</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            根据您的每日任务进行润色，或者一键生成免抽查、绝不重复的日常工作日志。
          </p>
        </div>
      </div>

      <div className="two-col-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="two-col-left">
          <InputPanel
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setQuickDate={setQuickDate}
            job={job}
            handleJobChange={handleJobChange}
            tone={tone}
            handleToneChange={handleToneChange}
            customJobName={customJobName}
            setCustomJobName={setCustomJobName}
            handleCustomJobNameBlur={handleCustomJobNameBlur}
            mode={mode}
            setMode={setMode}
            userInput={userInput}
            setUserInput={setUserInput}
            aiSettings={aiSettings}
            generating={generating}
            handleGenerate={handleGenerateWrapper}
            onNavigateToTab={onNavigateToTab}
          />
          <AIModelControls
            aiSettings={aiSettings}
            lastRouteInfo={lastRouteInfo}
            compareMode={compareMode}
            setCompareMode={setCompareMode}
            compareModels={compareModels}
            setCompareModels={setCompareModels}
            compareResults={compareResults}
            setCompareResults={setCompareResults}
            modelList={modelList}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isOpenRouterApi={isOpenRouterApi}
            handleQuickChangeModel={handleQuickChangeModel}
            toggleCompareModel={toggleCompareModel}
            buildDefaultCompareModels={(curr, list, url) => buildDefaultCompareModels(curr, list, url, DEFAULT_AI_MODEL, isOpenRouterApiUrl)}
            formatSelectedModel={formatSelectedModel}
            formatRouteLabel={formatRouteLabel}
            formatRouteTitle={formatRouteTitle}
            checkIsRecommended={checkIsRecommended}
            onNavigateToTab={onNavigateToTab}
          />
        </div>

        <PreviewPanel
          selectedDate={selectedDate}
          title={title}
          setTitle={setTitle}
          hours={hours}
          setHours={setHours}
          cooperation={cooperation}
          setCooperation={setCooperation}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          content={content}
          setContent={setContent}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
          copyAllFieldsText={copyAllFieldsText}
          mode={mode}
          generating={generating}
          handleTweak={handleTweakWrapper}
          saveStatus={saveStatus}
          handleSave={handleSave}
          maxSimilarity={maxSimilarity}
          similarDate={similarDate}
          simLevel={simLevel}
          aiSettings={aiSettings}
          compareMode={compareMode}
          compareResults={compareResults}
          applyCompareResult={applyCompareResult}
          lastRouteInfo={lastRouteInfo}
          handleCopyPromptAndOpenDoubao={handleCopyPromptAndOpenDoubao}
          handleGenerate={handleGenerateWrapper}
          formatRouteLabel={formatRouteLabel}
          formatRouteTitle={formatRouteTitle}
        />
      </div>
    </div>
  );
}
