import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Save, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { LogEntry, AppData, saveLog, BACKEND_URL } from '../utils/storage';
import {
  expandUserInput,
  generateRandomFrontendDaily,
  calculateSimilarity,
  getSimilarityLevel,
  generateAIPrompt
} from '../utils/generator';

interface DailyGeneratorProps {
  appData: AppData;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToTab?: (tab: string) => void;
}

// 智能识别核心免费推荐大模型 (对中文大白话生成效果最佳且免费的型号)
const checkIsRecommended = (m: { id: string; name: string; isFree: boolean }) => {
  const idLower = m.id.toLowerCase();
  if (idLower === 'openrouter/free' || idLower.includes('openrouter/free')) {
    return true;
  }
  if (m.isFree) {
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('coder')) return true;
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('next')) return true;
    if (idLower.includes('llama') && idLower.includes('3.3')) return true;
    if (idLower.includes('gemma')) return true;
  }
  return false;
};

export default function DailyGenerator({ appData, onSaveSuccess, showToast, onNavigateToTab }: DailyGeneratorProps) {
  // 当前选择的日期 (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // 工作模式: 'task' (正常任务), 'idle' (无特定任务/维护), 'study' (技术学习), 'ai_prompt' (豆包提示词)
  const [mode, setMode] = useState<'task' | 'idle' | 'study' | 'ai_prompt'>('task');
  
  // 用户的简短任务输入
  const [userInput, setUserInput] = useState<string>('');

  // 临时生成历史缓存（解决未存盘连续生成时的查重检测）
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);

  // 生成的表单字段
  const [title, setTitle] = useState<string>('');
  const [hours, setHours] = useState<number>(8);
  const [cooperation, setCooperation] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');

  // 相似度与查重状态
  const [maxSimilarity, setMaxSimilarity] = useState<number>(0);
  const [similarDate, setSimilarDate] = useState<string>('');
  
  // UI 交互状态
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // 本地实时选择的岗位与语气风格 (移动至主界面实时调控，消除延迟)
  const [job, setJob] = useState<string>('frontend');
  const [tone, setTone] = useState<string>('professional');

  // 大模型偏好快捷读取与快速切换
  // 大模型偏好快捷读取与快速切换
  const [aiSettings, setAiSettings] = useState({
    aiEnabled: false,
    aiApiKey: '',
    aiApiUrl: 'https://openrouter.ai/api/v1',
    aiModel: 'qwen/qwen-3-coder:free'
  });

  const loadAISettings = () => {
    const currentLoggedUser = localStorage.getItem('winner_daily_user') || 'admin';
    const hasBackendKey = appData.settings?.aiApiKey;

    const raw = localStorage.getItem(`winner_daily_ai_settings_${currentLoggedUser}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAiSettings({
          aiEnabled: appData.settings?.aiEnabled !== undefined ? appData.settings.aiEnabled : (parsed.aiEnabled || false),
          aiApiKey: hasBackendKey ? appData.settings.aiApiKey : (parsed.aiApiKey || ''),
          aiApiUrl: appData.settings?.aiApiUrl || parsed.aiApiUrl || 'https://openrouter.ai/api/v1',
          aiModel: appData.settings?.aiModel || parsed.aiModel || 'qwen/qwen-3-coder:free'
        });
        return;
      } catch (e) {
        console.error('加载快捷大模型设置失败:', e);
      }
    }

    setAiSettings({
      aiEnabled: appData.settings?.aiEnabled || false,
      aiApiKey: appData.settings?.aiApiKey || '',
      aiApiUrl: appData.settings?.aiApiUrl || 'https://openrouter.ai/api/v1',
      aiModel: appData.settings?.aiModel || 'qwen/qwen-3-coder:free'
    });
  };

  useEffect(() => {
    loadAISettings();
  }, [appData.settings]);

  // 同步用户在主界面上临时更改的配置，静默向后端保存偏好
  const handleJobChange = async (newJob: string) => {
    setJob(newJob);
    try {
      await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: newJob, tone })
      });
      onSaveSuccess();
    } catch (e) {
      console.error('静默保存岗位偏好失败:', e);
    }
  };

  const handleToneChange = async (newTone: string) => {
    setTone(newTone);
    try {
      await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, tone: newTone })
      });
      onSaveSuccess();
    } catch (e) {
      console.error('静默保存语气偏好失败:', e);
    }
  };

  const handleQuickChangeModel = (newModel: string) => {
    const currentLoggedUser = localStorage.getItem('winner_daily_user') || 'admin';
    const nextSettings = { ...aiSettings, aiModel: newModel };
    setAiSettings(nextSettings);
    
    // 写入当前特定用户的本地隔离配置中
    localStorage.setItem(`winner_daily_ai_settings_${currentLoggedUser}`, JSON.stringify(nextSettings));
    localStorage.setItem('winner_daily_ai_settings', JSON.stringify(nextSettings));
    showToast(`🎯 已快捷切换大模型为: ${newModel.split('/').pop() || newModel}`, 'success');
  };

  // 所有模型自选与搜索状态
  const [modelList, setModelList] = useState<{ id: string; name: string; isFree: boolean }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 初始化选择日期为今天 (当前系统时间 2026-07-02)
  useEffect(() => {
    // 根据后端 db.json 初始偏好同步组件 State 里的岗位与风格
    if (appData.settings) {
      setJob(appData.settings.job || 'frontend');
      setTone(appData.settings.tone || 'professional');
    }

    // 读取已缓存的云端完整模型列表供下拉搜索使用
    const cached = localStorage.getItem('winner_daily_cached_models');
    if (cached) {
      try {
        setModelList(JSON.parse(cached));
      } catch (e) {
        console.error('加载缓存大模型列表失败:', e);
      }
    } else {
      // 预设默认大模型列表
      setModelList([
        { id: 'openrouter/free', name: 'OpenRouter: Free Auto-Route (避堵推荐-免排队自动免费路由)', isFree: true },
        { id: 'qwen/qwen-3-coder:free', name: 'Qwen: Qwen3 Coder 480B (推荐-中文口语最强-免费)', isFree: true },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct (免费)', isFree: true },
        { id: 'google/gemma-2-9b-it:free', name: 'Google: Gemma 2 9B (免费)', isFree: true },
        { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen: Qwen 2.5 72B Instruct (免费)', isFree: true }
      ]);
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setSelectedDate(todayStr);
  }, []);

  // 如果该日期已有保存的日志，则自动加载
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
        // 否则清空或保留默认
        setTitle('');
        setHours(8);
        setContent('');
        setCooperation(false);
        setDifficulty(false);
      }
    }
  }, [selectedDate]);

  // 监听日志内容变化，实时进行查重比对
  useEffect(() => {
    if (!content) {
      setMaxSimilarity(0);
      setSimilarDate('');
      return;
    }

    let maxSim = 0;
    let simDate = '';

    // 1. 对比过去 30 天内除当天以外的日志
    Object.entries(appData.logs).forEach(([date, log]) => {
      if (date === selectedDate) return;
      
      const todayDate = new Date(selectedDate);
      const logDate = new Date(date);
      const diffTime = Math.abs(todayDate.getTime() - logDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return;

      const sim = calculateSimilarity(content, log.content);
      if (sim > maxSim) {
        maxSim = sim;
        simDate = `${date} 已保存的日志`;
      }
    });

    // 2. 对比本会话连续生成历史（防止点“智能生成”产生雷同）
    sessionHistory.forEach((histContent, idx) => {
      if (histContent === content) return; // 排除自身比对
      const sim = calculateSimilarity(content, histContent);
      if (sim > maxSim) {
        maxSim = sim;
        simDate = `刚才生成的第 ${idx + 1} 稿草稿`;
      }
    });

    setMaxSimilarity(maxSim);
    setSimilarDate(simDate);
  }, [content, selectedDate, appData.logs]);

  // 本地碰撞防重生成
  const generateLocally = (job: string) => {
    let bestResult: any = null;
    let lowestSim = 100;

    for (let attempts = 0; attempts < 10; attempts++) {
      let tempResult: any;
      if (mode === 'task') {
        tempResult = expandUserInput(userInput + (attempts > 0 ? ` #${attempts}` : ''), job);
      } else if (mode === 'idle') {
        tempResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, job);
      } else {
        tempResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), true, job);
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

  // 一键生成/扩写日志
  const handleGenerate = async () => {
    // 移除了局部的 const job = appData.settings.job，直接采用组件的 job State
    if (mode === 'ai_prompt') {
      const prompt = generateAIPrompt(userInput, job);
      setTitle('从大模型复制结果粘贴至此');
      setHours(8);
      setCooperation(false);
      setDifficulty(false);
      setContent(prompt);
      
      // 自动写入系统剪贴板，优化交互
      try {
        navigator.clipboard.writeText(prompt);
        showToast('📋 写实豆包提示词已自动复制到系统剪贴板，快去大模型粘贴吧！', 'success');
      } catch (err) {
        showToast('📋 提示词生成成功！请手动复制右侧面板文本使用。', 'info');
      }
      return;
    }

    // 在线 AI 智能生成 (直接使用 state 中同步好的设置)
    if (aiSettings.aiEnabled && aiSettings.aiApiKey) {
      setSaveStatus('saving'); // 借用保存 loading 状态
      showToast(`🤖 正在联调大模型 [${aiSettings.aiModel.split('/').pop() || aiSettings.aiModel}] 生成日报...`, 'info');
      try {
        const response = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userInput,
            job,
            mode, // 传递当前的工作模式状态 (用于空任务下的自适应预设)
            aiApiKey: aiSettings.aiApiKey,
            aiApiUrl: aiSettings.aiApiUrl,
            aiModel: aiSettings.aiModel
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || '联调接口请求失败');
        }

        const resData = await response.json();
        if (resData.success) {
          setTitle(resData.title);
          setHours(8);
          // 智能推导部门协作与工作难点
          setCooperation(userInput.includes('对接') || userInput.includes('联调') || userInput.includes('走查') || userInput.includes('切图'));
          setDifficulty(userInput.includes('bug') || userInput.includes('重构') || userInput.includes('走查'));
          setContent(resData.content);
          showToast('🎉 在线大模型日报生成成功！已填充表单。', 'success');

          // 加入去重会话缓存
          setSessionHistory((prev) => {
            const next = [...prev, resData.content];
            if (next.length > 8) next.shift();
            return next;
          });
        }
      } catch (error: any) {
        console.error('在线 AI 生成失败:', error);
        const errMsg = (error.message || String(error)).toLowerCase();
        
        // 针对上游 API 发生 429 或者是被限流的状况进行明确避堵 Toast 引导
        if (errMsg.includes('429') || errMsg.includes('too many requests') || errMsg.includes('limit')) {
          showToast('⚠️ 上游大模型服务开小差了 (已被平台限流 429 啦)！已为您降级为本地生成。建议您在左下角一键切换为 [避堵路由] 模型，即可秒速绕开拥堵！', 'error');
        } else {
          showToast(`❌ AI 生成失败: ${error.message || error}，已为您自动降级至本地生成。`, 'error');
        }
        generateLocally(job);
      } finally {
        setSaveStatus('idle');
      }
      return;
    }

    // 本地引擎生成
    generateLocally(job);
  };

  // 智能微调（重新生成混淆，仅限日常/学习模式下或作为任务的补充优化）
  const handleTweak = () => {
    // 微调处也直接读取当前首页选择的 job
    if (mode === 'idle') {
      const result = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, job);
      setContent(result.content);
    } else if (mode === 'study') {
      const result = generateRandomFrontendDaily(selectedDate + Math.random().toString(), true, job);
      setContent(result.content);
    } else {
      // 任务模式下，随机从模版库拼接一句日常优化，降低重复度
      const extraResult = generateRandomFrontendDaily(selectedDate + Math.random().toString(), false, job);
      const extraLine = extraResult.content.split('\n')[0].replace(/^\d+\.\s*/, '');
      const currentLines = content.split('\n');
      if (currentLines.length > 0) {
        // 替换最后一行或追加一行
        if (currentLines.length >= 2) {
          currentLines[currentLines.length - 1] = `${currentLines.length}. 日常系统维护：${extraLine}`;
        } else {
          currentLines.push(`2. 日常系统优化：${extraLine}`);
        }
        setContent(currentLines.join('\n'));
      }
    }
  };

  // 快速选择日期
  const setQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // 复制特定字段
  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName === 'title' ? '日志名称' : '日志内容'}已成功复制到剪贴板`, 'info');
    setTimeout(() => setCopiedField(null), 1500);
  };

  // 复制所有字段（导出格式）
  const copyAllFieldsText = () => {
    const text = `日志名称：${title}\n工时(h)：${hours}\n日志日期：${selectedDate}\n部门协作：${cooperation ? '是' : '否'}\n工作难点：${difficulty ? '是' : '否'}\n日志内容：\n${content}`;
    copyToClipboard(text, 'all');
    showToast('全套日报表单字段已一键复制', 'success');
  };

  // 保存到本地数据库
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('日志名称和内容不能为空！', 'error');
      return;
    }

    // 🔴 相似度硬拦截安全机制
    if (maxSimilarity >= appData.settings.similarityThreshold) {
      const confirmSave = window.confirm(
        `⚠️ 考勤高危警告：\n\n当前日志内容与 [${similarDate}] 的历史日志相似度高达 ${maxSimilarity}%！\n这已超过了您在配置中设定的高危报警线 (${appData.settings.similarityThreshold}%)。\n\n如果直接提交，极易被公司考勤抽查判定为“敷衍、抄袭或重复填报”而导致扣绩效分。\n\n您确定要强行保存吗？`
      );
      if (!confirmSave) {
        return; // 用户取消，中断保存，留在编辑状态方便修改
      }
    }

    setSaveStatus('saving');
    const logData = {
      title: title.trim(),
      hours: Number(hours),
      cooperation,
      difficulty,
      content: content.trim(),
      job,  // 使用实时自适应选择的岗位
      tone, // 使用实时自适应选择的语气
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* 注入旋转 spin 动画和流光 shimmer 骨架屏动画的关键帧样式声明 */}
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
      {/* 头部区域 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>智能日报生成器</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            根据您的每日任务进行润色，或者一键生成免抽查、绝不重复的日常工作日志。
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        {/* 左侧：输入与控制面板 */}
        <div
          className="glass-panel"
          style={{
            flex: '1',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '480px'
          }}
        >
          {/* AI 激活横幅，如果当前用户的 settings 里未配置 Key 则进行强力引导 */}
          {!aiSettings.aiApiKey && (
            <div 
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '11px',
                color: '#EAB308',
                lineHeight: '1.5'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
                <span>💡</span>
                <span>AI 大模型功能激活指引</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                检测到您尚未配置 API 密钥。若要开启智能生成日报功能，请优先做以下配置：
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
                <a 
                  href="https://openrouter.ai/workspaces/default/keys" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: '600' }}
                >
                  🔑 第一步：直达获取 OpenRouter API 密钥 (Keys)
                </a>
                <a 
                  href="https://openrouter.ai/models?max_price=0&output_modalities=text" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#34D399', textDecoration: 'underline', fontWeight: '600' }}
                >
                  🔍 第二步：查阅 OpenRouter 平台的免费模型列表
                </a>
              </div>
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('settings')}
                  className="clickable"
                  style={{
                    alignSelf: 'flex-start',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#F59E0B',
                    fontWeight: '600',
                    fontSize: '10px',
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                >
                  ➡️ 一键前往【个性化配置】配置 API Key
                </button>
              )}
            </div>
          )}

          {/* 1. 日期选择 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>选择日志日期</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={() => setQuickDate(0)} className="clickable" style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}>今天</button>
              <button onClick={() => setQuickDate(1)} className="clickable" style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}>昨天</button>
            </div>
          </div>

          {/* 1.5 岗位与语气风格自适应快速切换器 (移动自设置页，保证实时生效与偏好保存) */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>预设岗位</label>
              <select 
                value={job} 
                onChange={(e) => handleJobChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--glass-border)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="frontend">💻 前端开发工程师</option>
                <option value="designer">🎨 UI/UX 视觉设计师</option>
              </select>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>生成语气风格</label>
              <select 
                value={tone} 
                onChange={(e) => handleToneChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--glass-border)',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="professional">📋 专业严谨 (工作量饱和)</option>
                <option value="daily">☕ 轻松日常 (流水账极自然)</option>
              </select>
            </div>
          </div>

          {/* 2. 工作状态/模式选择 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>选择今天的工作状态</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '10px' }}>
              <button
                onClick={() => setMode('task')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'task' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'task' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: mode === 'task' ? '600' : '400'
                }}
              >
                🚀 正常有任务
              </button>
              <button
                onClick={() => setMode('idle')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'idle' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'idle' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: mode === 'idle' ? '600' : '400'
                }}
              >
                ☕ 无任务/维护
              </button>
              <button
                onClick={() => setMode('study')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'study' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'study' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: mode === 'study' ? '600' : '400'
                }}
              >
                📖 学习与预研
              </button>
              <button
                onClick={() => setMode('ai_prompt')}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: mode === 'ai_prompt' ? 'var(--accent-gradient)' : 'transparent',
                  color: mode === 'ai_prompt' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: mode === 'ai_prompt' ? '600' : '400'
                }}
              >
                🤖 豆包提示词
              </button>
            </div>
          </div>

          {/* 3. 简短任务输入 */}
          {mode === 'task' || mode === 'ai_prompt' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {mode === 'ai_prompt' ? '输入你想让豆包润色的任务' : '输入今日核心任务 (用逗号或换行分隔)'}
              </label>
              <textarea
                placeholder={mode === 'ai_prompt' ? "例如：写完了用户登录页面，顺便修了修老机型兼容问题" : "例如：对接登录页面接口，修复导航栏错位bug"}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                style={{
                  flex: 1,
                  resize: 'none',
                  minHeight: '120px',
                  lineHeight: '1.6'
                }}
              />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--glass-border)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                minHeight: '120px'
              }}
            >
              {mode === 'idle'
                ? '无需输入！系统将从庞大的“前端性能优化”、“代码重构”、“隐患排查”等专业库中，自动混淆拼接生成绝不重复的日报。'
                : '无需输入！系统将自动生成关于“前端前沿技术预研”、“团队规范梳理”等高含金量的沉淀式日报。'}
            </div>
          )}

          {/* 3.5 大模型极速切换与状态条 */}
          <div style={{ position: 'relative', marginTop: '4px' }}>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 12px', 
                borderRadius: '10px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--glass-border)',
                fontSize: '12px',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>AI 模式:</span>
                <span 
                  style={{ 
                    fontWeight: '600',
                    color: aiSettings.aiEnabled ? '#10B981' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {aiSettings.aiEnabled ? (
                    <>
                      {aiSettings.aiModel === 'openrouter/free' ? '🟢 🔥 [避堵路由]' : '🟢 🔥'} {aiSettings.aiModel.split('/').pop() || aiSettings.aiModel}
                    </>
                  ) : '🔴 未启用大模型 (降级本地引擎)'}
                </span>
              </div>
              {aiSettings.aiEnabled && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleQuickChangeModel('openrouter/free')}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: aiSettings.aiModel === 'openrouter/free' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: aiSettings.aiModel === 'openrouter/free' ? '#60A5FA' : 'var(--text-secondary)',
                      border: '1px solid ' + (aiSettings.aiModel === 'openrouter/free' ? 'rgba(59, 130, 246, 0.4)' : 'transparent'),
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    title="避堵推荐：免排队自动免费分流"
                  >
                    🚀 避堵路由
                  </button>
                  <button
                    onClick={() => handleQuickChangeModel('qwen/qwen-3-coder:free')}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: aiSettings.aiModel === 'qwen/qwen-3-coder:free' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: aiSettings.aiModel === 'qwen/qwen-3-coder:free' ? '#60A5FA' : 'var(--text-secondary)',
                      border: '1px solid ' + (aiSettings.aiModel === 'qwen/qwen-3-coder:free' ? 'rgba(59, 130, 246, 0.4)' : 'transparent'),
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    title="Qwen3 Coder 480B 免费推荐"
                  >
                    💻 Qwen3
                  </button>
                  <button
                    onClick={() => handleQuickChangeModel('meta-llama/llama-3.3-70b-instruct:free')}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: aiSettings.aiModel === 'meta-llama/llama-3.3-70b-instruct:free' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: aiSettings.aiModel === 'meta-llama/llama-3.3-70b-instruct:free' ? '#60A5FA' : 'var(--text-secondary)',
                      border: '1px solid ' + (aiSettings.aiModel === 'meta-llama/llama-3.3-70b-instruct:free' ? 'rgba(59, 130, 246, 0.4)' : 'transparent'),
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                    title="Llama 3.3 70B 免费备选"
                  >
                    🦙 Llama
                  </button>
                  {/* 新设“更多自选”悬浮按钮，支持主页面所有大模型搜索与切换 */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: isDropdownOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: isDropdownOpen ? '#34D399' : 'var(--text-secondary)',
                      border: '1px solid ' + (isDropdownOpen ? 'rgba(16, 185, 129, 0.4)' : 'transparent'),
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    🔍 更多模型
                  </button>
                </div>
              )}
            </div>

            {/* 主界面多模型检索切换悬浮卡片 */}
            {isDropdownOpen && aiSettings.aiEnabled && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  right: '10px',
                  marginBottom: '6px',
                  width: '280px',
                  borderRadius: '10px',
                  background: 'rgba(21, 28, 44, 0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  padding: '8px',
                  zIndex: 999
                }}
              >
                <input 
                  type="text"
                  placeholder="搜索已同步的所有模型..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    color: '#ffffff',
                    fontSize: '11px',
                    outline: 'none',
                    marginBottom: '4px'
                  }}
                />
                <div 
                  style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {(() => {
                    const getModelWeight = (m: { id: string; name: string; isFree: boolean }) => {
                      const isRec = checkIsRecommended(m);
                      if (m.isFree && isRec) return 4;
                      if (m.isFree) return 3;
                      if (isRec) return 2;
                      return 1;
                    };

                    const filtered = modelList
                      .filter(m => 
                        m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (searchQuery.toLowerCase() === 'free' && m.isFree)
                      )
                      .sort((a, b) => getModelWeight(b) - getModelWeight(a));

                    return filtered.length > 0 ? (
                      filtered.map((m) => {
                        const isRec = checkIsRecommended(m);
                        const isAuto = m.id.toLowerCase().includes('openrouter/free');
                        const isSelected = aiSettings.aiModel === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickChangeModel(m.id);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className="clickable"
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                              border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                              fontSize: '11px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                            }}
                          >
                            <span style={{ fontWeight: isSelected ? '700' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                              {isRec ? (isAuto ? '🔥 [避堵] ' : '🔥 ') : ''}{m.name}
                            </span>
                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                              {isAuto && (
                                <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: '700' }}>
                                  首选
                                </span>
                              )}
                              {isRec && !isAuto && (
                                <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: '700' }}>
                                  推荐
                                </span>
                              )}
                              <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: m.isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: m.isFree ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                                {m.isFree ? '免费' : '付费'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>
                        无匹配模型
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 4. 触发生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={saveStatus === 'saving'}
            className="clickable"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: saveStatus === 'saving' ? 'rgba(79, 70, 229, 0.4)' : 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: saveStatus === 'saving' ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer'
            }}
          >
            {saveStatus === 'saving' ? (
              <RefreshCw 
                size={16} 
                style={{ 
                  animation: 'spin 1.2s linear infinite' 
                }} 
              />
            ) : (
              <Sparkles size={16} />
            )}
            <span>
              {saveStatus === 'saving' 
                ? '🤖 大模型正在撰写中...' 
                : (mode === 'ai_prompt' ? '一键生成豆包 Prompt' : '智能生成今日日报')
              }
            </span>
          </button>

          {/* 5. 豆包专属快捷栏 */}
          {mode === 'ai_prompt' && content.startsWith('你是一个') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  setCopiedField('ai_prompt_btn');
                  showToast('🤖 提示词复制成功！正在前往豆包...', 'success');
                  setTimeout(() => setCopiedField(null), 1500);
                  window.open('https://www.doubao.com', '_blank');
                }}
                className="clickable"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--accent-color)',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedField === 'ai_prompt_btn' ? <Check size={14} color="#10B981" /> : <Sparkles size={14} />}
                <span>{copiedField === 'ai_prompt_btn' ? '已复制 Prompt！正在打开豆包...' : '📋 复制 Prompt 并前往豆包'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 右侧：生成结果与表单模拟卡片 */}
        <div
          className="glass-panel"
          style={{
            flex: '1.3',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}
        >
          {/* 大模型飞星流光加载遮罩层 (加载动效) */}
          {saveStatus === 'saving' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              zIndex: 10
            }}>
              <Sparkles size={32} style={{ color: '#818CF8', animation: 'spin 2s linear infinite' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '80%', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  🤖 大模型正在撰写写实日报，请稍候...
                </span>
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }} />
                <div style={{
                  width: '80%',
                  height: '6px',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }} />
              </div>
            </div>
          )}

          {/* 表单标题模拟 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>适配系统表单预览</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={copyAllFieldsText}
                className="clickable"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedField === 'all' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{copiedField === 'all' ? '已复制全部' : '复制全部字段'}</span>
              </button>
            </div>
          </div>

          {/* 表单字段区 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            {/* 1. 日志名称 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>日志名称:</label>
              <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  maxLength={30}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="自动生成，最长30字"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => copyToClipboard(title, 'title')}
                  className="clickable"
                  style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)' }}
                  title="单独复制日志名称"
                >
                  {copiedField === 'title' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* 2. 工时 与 日期 */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>工时(h):</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>日志日期:</label>
                <input
                  type="text"
                  value={selectedDate}
                  disabled
                  style={{ flex: 1, background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
                />
              </div>
            </div>

            {/* 3. 部门协作 与 工作难点 */}
            <div style={{ display: 'flex', gap: '40px', paddingLeft: '102px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="cooperation"
                  checked={cooperation}
                  onChange={(e) => setCooperation(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="cooperation" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>部门协作 (是/否)</label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="difficulty"
                  checked={difficulty}
                  onChange={(e) => setDifficulty(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="difficulty" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>工作难点 (是/否)</label>
              </div>
            </div>

            {/* 4. 日志内容 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
              <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right', marginTop: '8px' }}>日志内容:</label>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: '220px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                  <textarea
                    maxLength={3000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请填写日志内容，最长3000字"
                    style={{
                      flex: 1,
                      resize: 'none',
                      lineHeight: '1.6',
                      minHeight: '200px'
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(content, 'content')}
                    className="clickable"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)'
                    }}
                    title="单独复制日志内容"
                  >
                    {copiedField === 'content' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 查重提示与底栏控制 */}
          <div
            style={{
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* 相似度状态 */}
            {content ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: simLevel.color,
                    boxShadow: `0 0 8px ${simLevel.color}`
                  }}
                />
                <div style={{ fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>最近30天最大相似度: </span>
                  <span style={{ fontWeight: '700', color: simLevel.color }}>{maxSimilarity}%</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({simLevel.text})</span>
                  {maxSimilarity > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      最相似日期: {similarDate}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>暂无生成内容，请在左侧点击生成。</div>
            )}

            {/* 控制按钮组 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* 微调混淆 */}
              {content && (
                <button
                  onClick={handleTweak}
                  className="clickable"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="重新洗牌内容，降低重复率"
                >
                  <RefreshCw size={14} />
                  <span>智能微调</span>
                </button>
              )}

              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                className="clickable"
                disabled={saveStatus === 'saving'}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: saveStatus === 'success' ? '#10B981' : 'var(--accent-gradient)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)'
                }}
              >
                {saveStatus === 'saving' ? (
                  <RefreshCw size={14} style={{ animation: 'pulse-slow 1s infinite' }} />
                ) : saveStatus === 'success' ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                <span>
                  {saveStatus === 'saving'
                    ? '正在保存...'
                    : saveStatus === 'success'
                    ? '已保存到数据库'
                    : saveStatus === 'error'
                    ? '保存失败，已写入本地缓存'
                    : '保存并记录'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
