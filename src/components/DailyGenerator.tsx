import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Save, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { LogEntry, AppData, saveLog } from '../utils/storage';
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
}

export default function DailyGenerator({ appData, onSaveSuccess }: DailyGeneratorProps) {
  // 当前选择的日期 (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // 工作模式: 'task' (正常任务), 'idle' (无特定任务/维护), 'study' (技术学习), 'ai_prompt' (豆包提示词)
  const [mode, setMode] = useState<'task' | 'idle' | 'study' | 'ai_prompt'>('task');
  
  // 用户的简短任务输入
  const [userInput, setUserInput] = useState<string>('');

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

  // 初始化选择日期为今天 (当前系统时间 2026-07-02)
  useEffect(() => {
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

    // 对比过去 30 天内除当天以外的日志
    Object.entries(appData.logs).forEach(([date, log]) => {
      if (date === selectedDate) return;
      
      // 限制在30天窗口内
      const diffTime = Math.abs(new Date(selectedDate).getTime() - new Date(date).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return;

      const sim = calculateSimilarity(content, log.content);
      if (sim > maxSim) {
        maxSim = sim;
        simDate = date;
      }
    });

    setMaxSimilarity(maxSim);
    setSimilarDate(simDate);
  }, [content, selectedDate, appData.logs]);

  // 一键生成/扩写日志
  const handleGenerate = () => {
    const job = appData.settings.job || 'frontend';
    if (mode === 'task') {
      const result = expandUserInput(userInput, job);
      setTitle(result.title);
      setHours(result.hours);
      setCooperation(result.cooperation);
      setDifficulty(result.difficulty);
      setContent(result.content);
    } else if (mode === 'idle') {
      const result = generateRandomFrontendDaily(selectedDate, false, job);
      setTitle(result.title);
      setHours(result.hours);
      setCooperation(result.cooperation);
      setDifficulty(result.difficulty);
      setContent(result.content);
    } else if (mode === 'study') {
      const result = generateRandomFrontendDaily(selectedDate, true, job);
      setTitle(result.title);
      setHours(result.hours);
      setCooperation(result.cooperation);
      setDifficulty(result.difficulty);
      setContent(result.content);
    } else {
      const prompt = generateAIPrompt(userInput, job);
      setTitle('从豆包复制结果粘贴至此');
      setHours(8);
      setCooperation(false);
      setDifficulty(false);
      setContent(prompt);
    }
  };

  // 智能微调（重新生成混淆，仅限日常/学习模式下或作为任务的补充优化）
  const handleTweak = () => {
    const job = appData.settings.job || 'frontend';
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
    setTimeout(() => setCopiedField(null), 1500);
  };

  // 复制所有字段（导出格式）
  const copyAllFieldsText = () => {
    const text = `日志名称：${title}\n工时(h)：${hours}\n日志日期：${selectedDate}\n部门协作：${cooperation ? '是' : '否'}\n工作难点：${difficulty ? '是' : '否'}\n日志内容：\n${content}`;
    copyToClipboard(text, 'all');
  };

  // 保存到本地数据库
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('日志名称和内容不能为空！');
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
      job: appData.settings.job,
      tone: appData.settings.tone,
      isAutoGenerated: mode !== 'task'
    };

    const res = await saveLog(selectedDate, logData);
    if (res.success) {
      setSaveStatus('success');
      onSaveSuccess();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const simLevel = getSimilarityLevel(maxSimilarity, appData.settings.similarityThreshold);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
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

          {/* 4. 触发生成按钮 */}
          <button
            onClick={handleGenerate}
            className="clickable"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Sparkles size={16} />
            <span>{mode === 'ai_prompt' ? '一键生成豆包 Prompt' : '智能生成今日日报'}</span>
          </button>

          {/* 5. 豆包专属快捷栏 */}
          {mode === 'ai_prompt' && content.startsWith('你是一个') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(content);
                  setCopiedField('ai_prompt_btn');
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
