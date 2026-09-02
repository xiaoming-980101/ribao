import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, CalendarRange, RefreshCw, CheckCircle2, Sparkles, Download, Bot } from 'lucide-react';
import { AppData, LogEntry, generateAIWeeklyReport, getUserAISettings } from '../utils/storage';

interface WeeklyGeneratorProps {
  appData: AppData;
}

export default function WeeklyGenerator({ appData }: WeeklyGeneratorProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [weekDays, setWeekDays] = useState<{ dateStr: string; dayName: string; log?: LogEntry }[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAIGenerating, setIsAIGenerating] = useState<boolean>(false);

  const getYearAndWeek = (date: Date): { year: number; week: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  const getDatesOfWeek = (y: number, w: number): Date[] => {
    const simple = new Date(y, 0, 4);
    const dayOfWeek = simple.getDay() || 7;
    const dayOffset = (w - 1) * 7 - (dayOfWeek - 1);
    
    const monday = new Date(y, 0, 4 + dayOffset);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(d);
    }
    return dates;
  };

  useEffect(() => {
    const today = new Date();
    const { year: curYear, week: curWeek } = getYearAndWeek(today);
    setSelectedYear(curYear);
    setSelectedWeek(curWeek);
  }, []);

  useEffect(() => {
    const dates = getDatesOfWeek(selectedYear, selectedWeek);
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    
    const formattedDays = dates.map((d, index) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      return {
        dateStr,
        dayName: dayNames[index],
        log: appData.logs[dateStr]
      };
    });

    setWeekDays(formattedDays);
    setWeeklyReport('');
  }, [selectedYear, selectedWeek, appData.logs]);

  // 本地规则聚合周报
  const handleGenerateLocalWeekly = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const filledDays = weekDays.filter(day => day.log);
      if (filledDays.length === 0) {
        alert('本周暂无已归档的工作事项，请先完成事项记录后再进行聚合！');
        setIsGenerating(false);
        return;
      }

      const workItems: string[] = [];
      const cooperationItems: string[] = [];
      const difficultyItems: string[] = [];
      let totalHours = 0;

      filledDays.forEach(day => {
        const log = day.log!;
        totalHours += log.hours;

        const lines = log.content.split('\n')
          .map(line => line.replace(/^\d+[.、]\s*/, '').trim())
          .filter(Boolean);

        lines.forEach(line => {
          // 精准过滤与相似短语合并
          const cleanLine = line.replace(/^[【“]|[”】]$/g, '').trim();
          if (cleanLine && !workItems.some(item => item.includes(cleanLine) || cleanLine.includes(item))) {
            workItems.push(cleanLine);
          }
        });

        if (log.cooperation) {
          cooperationItems.push(`${day.dateStr} (${day.dayName}) 开展了 ${log.title}`);
        }
        if (log.difficulty) {
          difficultyItems.push(`${day.dateStr} (${day.dayName}) 攻克了 [${log.title}] 相关技术难点`);
        }
      });

      const dates = getDatesOfWeek(selectedYear, selectedWeek);
      const startRangeStr = `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}`;
      const endRangeStr = `${dates[6].getFullYear()}-${String(dates[6].getMonth() + 1).padStart(2, '0')}-${String(dates[6].getDate()).padStart(2, '0')}`;

      let reportText = `## 周期事项工作报告 (${startRangeStr} 至 ${endRangeStr})\n\n`;
      reportText += `**本周累计工时**: ${Math.round(totalHours * 10) / 10} 小时\n\n`;
      
      reportText += `### 一、本周重点交付与推进\n`;
      if (workItems.length > 0) {
        workItems.forEach((item, index) => {
          reportText += `${index + 1}. ${item}\n`;
        });
      } else {
        reportText += `- 无特定工作项录入。\n`;
      }
      reportText += `\n`;

      reportText += `### 二、关键成果与协同攻坚\n`;
      if (difficultyItems.length > 0 || cooperationItems.length > 0) {
        if (difficultyItems.length > 0) {
          reportText += `**技术攻坚**:\n`;
          difficultyItems.forEach(item => {
            reportText += `- ${item}\n`;
          });
        }
        if (cooperationItems.length > 0) {
          reportText += `**跨团队协作**:\n`;
          cooperationItems.forEach(item => {
            reportText += `- ${item}\n`;
          });
        }
      } else {
        reportText += `- 本周推进常规工作开发，无显著突出难点与协作异常。\n`;
      }
      reportText += `\n`;

      reportText += `### 三、下周工作规划\n`;
      reportText += `1. 持续推进排期内核心需求的联调与全流程自测，确保交付质量稳定。\n`;
      reportText += `2. 针对业务测试反馈的缺陷与偶发性边界问题进行专项清理与回归验证。\n`;
      reportText += `3. 对相关通用模块与链路逻辑进行代码精简，提升系统整体运行效能。\n`;

      setWeeklyReport(reportText);
      setIsGenerating(false);
    }, 400);
  };

  // AI 智能周报提炼
  const handleGenerateAIWeekly = async () => {
    const filledDays = weekDays.filter(day => day.log);
    if (filledDays.length === 0) {
      alert('本周暂无已归档的工作事项，请先完成事项记录后再进行提炼！');
      return;
    }

    const localAI = getUserAISettings();
    const apiKey = localAI.aiApiKey || appData.settings.aiApiKey;
    const apiUrl = localAI.aiApiUrl || appData.settings.aiApiUrl;
    const model = localAI.aiModel || appData.settings.aiModel;

    if (!apiKey) {
      alert('请先在【工作台首选项】中配置 API 密钥，以便开启 AI 智能周报提炼！');
      return;
    }

    setIsAIGenerating(true);
    const dates = getDatesOfWeek(selectedYear, selectedWeek);
    const startRangeStr = `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}`;
    const endRangeStr = `${dates[6].getFullYear()}-${String(dates[6].getMonth() + 1).padStart(2, '0')}-${String(dates[6].getDate()).padStart(2, '0')}`;

    const weekLogs = filledDays.map(d => ({
      date: d.dateStr,
      dayName: d.dayName,
      title: d.log!.title,
      hours: d.log!.hours,
      cooperation: d.log!.cooperation,
      difficulty: d.log!.difficulty,
      content: d.log!.content
    }));

    const totalHours = weekLogs.reduce((acc, cur) => acc + cur.hours, 0);

    const res = await generateAIWeeklyReport({
      job: appData.settings.job,
      customJobName: appData.settings.customJobName,
      startDate: startRangeStr,
      endDate: endRangeStr,
      weekLogs,
      aiApiKey: apiKey,
      aiApiUrl: apiUrl,
      aiModel: model
    });

    if (res.success && res.report) {
      let finalDoc = `## 周期事项工作报告 (${startRangeStr} 至 ${endRangeStr})\n\n`;
      finalDoc += `**本周累计工时**: ${Math.round(totalHours * 10) / 10} 小时\n\n`;
      finalDoc += res.report;
      setWeeklyReport(finalDoc);
    } else {
      alert(`AI 周报提炼遇到异常: ${res.error || '网络连接超时'}，已为您无缝降级为本地规则聚合。`);
      handleGenerateLocalWeekly();
    }
    setIsAIGenerating(false);
  };

  const copyToClipboard = () => {
    if (!weeklyReport) return;
    navigator.clipboard.writeText(weeklyReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!weeklyReport) return;
    const blob = new Blob([weeklyReport], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `周报_${selectedYear}_第${selectedWeek}周.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filledCount = weekDays.filter(d => d.log).length;
  const totalHours = weekDays.reduce((sum, d) => sum + (d.log?.hours || 0), 0);
  const dates = getDatesOfWeek(selectedYear, selectedWeek);
  const startStr = `${dates[0].getFullYear()}/${dates[0].getMonth() + 1}/${dates[0].getDate()}`;
  const endStr = `${dates[6].getFullYear()}/${dates[6].getMonth() + 1}/${dates[6].getDate()}`;

  const localAISettings = getUserAISettings();
  const hasAIConfig = !!(localAISettings.aiApiKey || appData.settings.aiApiKey);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', flex: 1, maxWidth: '1100px' }}>
      {/* 头部标题 */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>周期事项归档与智能周报</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          基于已归档的真实事项自动聚合、AI 智能升华提炼，结构化输出本周期工作交付、攻坚突破与下阶段规划。
        </p>
      </div>

      {/* 控制面板 */}
      <div className="liquid-glass-card" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarRange size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>选择周次:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ width: '100px', padding: '8px 12px' }}
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>

            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              style={{ width: '130px', padding: '8px 12px' }}
            >
              {Array.from({ length: 53 }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>第 {w} 周</option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--glass-surface-subtle)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border-subtle)' }}>
            范围: {startStr} - {endStr}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {hasAIConfig && (
            <button
              onClick={handleGenerateAIWeekly}
              disabled={isAIGenerating || isGenerating}
              className="clickable glow-btn"
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #6366F1 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                cursor: (isAIGenerating || isGenerating) ? 'not-allowed' : 'pointer'
              }}
            >
              {isAIGenerating ? (
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Bot size={15} />
              )}
              <span>{isAIGenerating ? 'AI 正在深度提炼周报...' : 'AI 智能升华提炼周报'}</span>
            </button>
          )}

          <button
            onClick={handleGenerateLocalWeekly}
            disabled={isGenerating || isAIGenerating}
            className="clickable"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px var(--accent-glow)',
              cursor: (isGenerating || isAIGenerating) ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={15} />
            )}
            <span>{isGenerating ? '正在汇总整理...' : '本地规则聚合'}</span>
          </button>
        </div>
      </div>

      {/* 本周每日填报状态指示 */}
      <div className="liquid-glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700' }}>本周事项归档完整度</span>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              累计工时: <strong style={{ color: 'var(--accent-color)' }}>{Math.round(totalHours * 10) / 10}h</strong>
            </span>
            <span style={{ fontSize: '12px', color: filledCount >= 5 ? '#10B981' : '#F59E0B', fontWeight: '700' }}>
              已填 {filledCount} / 7 天
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {weekDays.map((day) => {
            const hasLog = !!day.log;
            return (
              <div
                key={day.dateStr}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: hasLog ? 'rgba(16, 185, 129, 0.12)' : 'var(--glass-surface-subtle)',
                  border: hasLog ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>{day.dayName}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.dateStr.substring(5)}</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  {hasLog ? (
                    <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontWeight: '700' }}>
                      <CheckCircle2 size={11} /> 已录入
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>未录入</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 周报生成结果区 */}
      {weeklyReport && (
        <div className="liquid-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>周期报告预览与导出</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={downloadMarkdown}
                className="clickable"
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="导出为标准 Markdown 文件"
              >
                <Download size={14} />
                <span>导出 .md</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="clickable"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: copied ? '#10B981' : 'var(--accent-gradient)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px var(--accent-glow)'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? '已复制到剪贴板' : '复制归档报告'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={weeklyReport}
            onChange={(e) => setWeeklyReport(e.target.value)}
            style={{
              width: '100%',
              minHeight: '360px',
              resize: 'vertical',
              lineHeight: '1.7',
              fontFamily: 'monospace',
              fontSize: '13px'
            }}
          />
        </div>
      )}
    </div>
  );
}
