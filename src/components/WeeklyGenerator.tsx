import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, CalendarRange, RefreshCw, AlertCircle } from 'lucide-react';
import { AppData, LogEntry } from '../utils/storage';

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

  // 获取当前的年份和周数
  const getYearAndWeek = (date: Date): { year: number; week: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
  };

  // 根据年份和周数获取这一周所有的日期 (周一到周日)
  const getDatesOfWeek = (y: number, w: number): Date[] => {
    // 寻找该年1月4日，它是第1周必包含的一天
    const simple = new Date(y, 0, 4);
    const dayOfWeek = simple.getDay() || 7; // 周日为7
    const dayOffset = (w - 1) * 7 - (dayOfWeek - 1);
    
    const monday = new Date(y, 0, 4 + dayOffset);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(d);
    }
    return dates;
  };

  // 初始化为当前日期所在的年份和周 (基于 2026-07-02)
  useEffect(() => {
    const today = new Date();
    const { year: curYear, week: curWeek } = getYearAndWeek(today);
    setSelectedYear(curYear);
    setSelectedWeek(curWeek);
  }, []);

  // 当年份、周数或已保存日志发生变化时，拉取该周的所有数据
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
    setWeeklyReport(''); // 重置已生成的周报
  }, [selectedYear, selectedWeek, appData.logs]);

  // 生成周报算法
  const handleGenerateWeekly = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const filledDays = weekDays.filter(day => day.log);
      if (filledDays.length === 0) {
        alert('本周没有任何已填写的日报，请先去补录日报后再生成周报！');
        setIsGenerating(false);
        return;
      }

      // 提取本周所有具体工作项 (去重，整理)
      const workItems: string[] = [];
      const cooperationItems: string[] = [];
      const difficultyItems: string[] = [];
      let totalHours = 0;

      filledDays.forEach(day => {
        const log = day.log!;
        totalHours += log.hours;

        // 提取日报内容中的条目 (按行或分号分割)
        const lines = log.content.split('\n')
          .map(line => line.replace(/^\d+[.、]\s*/, '').trim())
          .filter(Boolean);

        lines.forEach(line => {
          // 简单去重，避免重复加入模板性语料
          if (!workItems.some(item => item.substring(0, 15) === line.substring(0, 15))) {
            workItems.push(line);
          }
        });

        // 提取协作和难点
        if (log.cooperation) {
          cooperationItems.push(`${day.dateStr} (${day.dayName}) 开展了 ${log.title}`);
        }
        if (log.difficulty) {
          difficultyItems.push(`${day.dateStr} (${day.dayName}) 攻克了 [${log.title}] 相关技术难点`);
        }
      });

      // 组装周报 Markdown 文本
      const dates = getDatesOfWeek(selectedYear, selectedWeek);
      const startRangeStr = `${dates[0].getFullYear()}-${String(dates[0].getMonth() + 1).padStart(2, '0')}-${String(dates[0].getDate()).padStart(2, '0')}`;
      const endRangeStr = `${dates[6].getFullYear()}-${String(dates[6].getMonth() + 1).padStart(2, '0')}-${String(dates[6].getDate()).padStart(2, '0')}`;

      let reportText = `## 📅 工作周报 (${startRangeStr} 至 ${endRangeStr})\n\n`;
      reportText += `**本周累计投入工时**: ${totalHours} 小时\n\n`;
      
      reportText += `### 一、本周工作总结\n`;
      if (workItems.length > 0) {
        workItems.forEach((item, index) => {
          reportText += `${index + 1}. ${item}\n`;
        });
      } else {
        reportText += `- 无特定工作项录入。\n`;
      }
      reportText += `\n`;

      reportText += `### 二、关键成果与难点突破\n`;
      if (difficultyItems.length > 0 || cooperationItems.length > 0) {
        if (difficultyItems.length > 0) {
          reportText += `**攻坚难点**:\n`;
          difficultyItems.forEach(item => {
            reportText += `- ${item}\n`;
          });
        }
        if (cooperationItems.length > 0) {
          reportText += `**跨部门协作**:\n`;
          cooperationItems.forEach(item => {
            reportText += `- ${item}\n`;
          });
        }
      } else {
        reportText += `- 本周推进常规工作开发，无显著突出难点与协作异常。\n`;
      }
      reportText += `\n`;

      // 智能生成下周计划
      reportText += `### 三、下周工作计划\n`;
      reportText += `1. 持续推进本期业务需求的细节演进与代码自测自查，确保项目按期保质提测。\n`;
      reportText += `2. 针对下周测试提测反馈的偶发性 Bug 进行专项排查定位，提高业务系统交付稳定性。\n`;
      reportText += `3. 对项目内非核心模块的冗余逻辑与组件实施局部优化重构，进一步提升前端页面渲染流畅度。\n`;

      setWeeklyReport(reportText);
      setIsGenerating(false);
    }, 800);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(weeklyReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 生成周数列表供选择 (通常1-53周)
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);
  const years = [2025, 2026, 2027];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* 标题 */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>周报智能汇总生成器</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          自动拉取您本周已提交的所有日报内容，智能去除冗余废话，精炼合并生成一份规范的高质量工作周报。
        </p>
      </div>

      <div className="two-col-layout">
        {/* 左侧：周选择与日报预览 */}
        <div
          className="glass-panel two-col-left"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* 选择周数 */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <CalendarRange size={18} color="var(--accent-color)" />
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ flex: 1 }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                style={{ flex: 1 }}
              >
                {weeks.map(w => (
                  <option key={w} value={w}>第 {w} 周</option>
                ))}
              </select>
            </div>
          </div>

          {/* 本周日报预览列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>本周日志提取预览</label>
            
            {weekDays.map((day, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '12px',
                  background: day.log ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                  opacity: day.log ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    {day.dateStr} ({day.dayName})
                  </span>
                  {day.log ? (
                    <span style={{ color: '#10B981', fontWeight: '600' }}>
                      已填 ({day.log.hours}h)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>未填</span>
                  )}
                </div>

                {day.log ? (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-color)' }}>
                      {day.log.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line',
                        marginTop: '4px',
                        maxHeight: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {day.log.content}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={12} />
                    <span>该日期无记录，周报提炼时将自动跳过此天</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 生成动作 */}
          <button
            onClick={handleGenerateWeekly}
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
            <RefreshCw size={16} style={{ animation: isGenerating ? 'pulse-slow 1s infinite' : 'none' }} />
            <span>{isGenerating ? '正在智能合并汇总...' : '一键生成本周周报'}</span>
          </button>
        </div>

        {/* 右侧：生成结果周报展示 */}
        <div
          className="glass-panel two-col-right"
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>周报 Markdown 预览</h3>
            </div>
            {weeklyReport && (
              <button
                onClick={copyToClipboard}
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
                {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                <span>{copied ? '已复制' : '复制周报 Markdown'}</span>
              </button>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex' }}>
            {weeklyReport ? (
              <textarea
                value={weeklyReport}
                onChange={(e) => setWeeklyReport(e.target.value)}
                style={{
                  flex: 1,
                  resize: 'none',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: 'monospace',
                  minHeight: '400px'
                }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  border: '2px dashed var(--glass-border)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  gap: '8px',
                  minHeight: '400px',
                  padding: '24px'
                }}
              >
                <FileText size={32} style={{ opacity: 0.5 }} />
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '14px' }}>周报未生成</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    请在左侧选择需要汇总的年份和周数，确认有已保存的日志后，点击“一键生成本周周报”。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
