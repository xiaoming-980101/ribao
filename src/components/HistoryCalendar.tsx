import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  Coffee,
  HelpCircle
} from 'lucide-react';
import { AppData, deleteLog, saveLog } from '../utils/storage';
import { generateRandomFrontendDaily, expandUserInput } from '../utils/generator';

interface HistoryCalendarProps {
  appData: AppData;
  onLogChange: () => void;
  onNavigateToGenerator: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HistoryCalendar({
  appData,
  onLogChange,
  onNavigateToGenerator,
  showToast
}: HistoryCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 补录快速表单状态
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickHours, setQuickHours] = useState(8);
  const [quickCooperation, setQuickCooperation] = useState(false);
  const [quickDifficulty, setQuickDifficulty] = useState(false);

  // 基础时间计算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rollingDays = appData.settings.rollingDays || 7;
  // 滚动补录窗口的开始日期
  const sevenDaysAgo = new Date(today.getTime() - (rollingDays - 1) * 24 * 60 * 60 * 1000);

  // 日历生成逻辑
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 本月第一天是周几
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // 本月有多少天

  const prevMonthDays = new Date(year, month, 0).getDate(); // 上个月有多少天

  const calendarCells = [];

  // 1. 上个月垫后日期
  // 如果本月第一天是周日 (firstDayOfMonth === 0)，需要垫 6 天 (如果是周一到周六，垫 firstDayOfMonth - 1 天)
  const daysToPad = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  for (let i = daysToPad; i > 0; i--) {
    const d = prevMonthDays - i + 1;
    const prevMonthDate = new Date(year, month - 1, d);
    calendarCells.push({
      date: prevMonthDate,
      isCurrentMonth: false
    });
  }

  // 2. 本月日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    calendarCells.push({
      date,
      isCurrentMonth: true
    });
  }

  // 3. 下个月垫前日期 (保证日历是 6 行，共 42 个格子)
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    calendarCells.push({
      date: nextMonthDate,
      isCurrentMonth: false
    });
  }

  // 转换日期对象为 YYYY-MM-DD
  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 评估某天的状态属性
  const getDateStatus = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    const dateStr = formatDateStr(date);
    const hasLog = !!appData.logs[dateStr];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isFuture = date > today;
    const inWindow = date >= sevenDaysAgo && date <= today;

    // 过期天数计算：如果是漏填的，计算离今天过去了几天，离过期还剩几天
    let daysLeftToFill = 0;
    if (inWindow && !hasLog && !isWeekend) {
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysLeftToFill = (rollingDays - 1) - diffDays; // 还剩几天可以补填
    }

    return {
      hasLog,
      isWeekend,
      isFuture,
      inWindow,
      daysLeftToFill
    };
  };

  // 切换月份
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 选中某天
  const handleSelectDate = (date: Date) => {
    const status = getDateStatus(date);
    if (status.isFuture) return; // 未来日期不可选

    const dateStr = formatDateStr(date);
    setSelectedDateStr(dateStr);

    if (appData.logs[dateStr]) {
      // 已有日志，加载详情
      const log = appData.logs[dateStr];
      setQuickTitle(log.title);
      setQuickContent(log.content);
      setQuickHours(log.hours);
      setQuickCooperation(log.cooperation);
      setQuickDifficulty(log.difficulty);
    } else {
      // 未填日志，清空表单并初始化默认值
      setQuickTitle('');
      setQuickContent('');
      setQuickHours(8);
      setQuickCooperation(false);
      setQuickDifficulty(false);
    }
  };

  // 快捷一键自动补录（最核心爽点功能）
  const handleQuickAutoGenerate = () => {
    if (!selectedDateStr) return;
    const job = appData.settings.job || 'frontend';
    const result = generateRandomFrontendDaily(selectedDateStr, false, job);
    setQuickTitle(result.title);
    setQuickHours(result.hours);
    setQuickCooperation(result.cooperation);
    setQuickDifficulty(result.difficulty);
    setQuickContent(result.content);
  };

  // 快捷一键保存
  const handleQuickSave = async () => {
    if (!selectedDateStr || !quickTitle.trim() || !quickContent.trim()) {
      showToast('请输入日志标题和内容！', 'error');
      return;
    }

    const logData = {
      title: quickTitle.trim(),
      hours: Number(quickHours),
      cooperation: quickCooperation,
      difficulty: quickDifficulty,
      content: quickContent.trim(),
      job: appData.settings.job,
      tone: appData.settings.tone,
      isAutoGenerated: true
    };

    const res = await saveLog(selectedDateStr, logData);
    if (res.success) {
      showToast(`🎉 ${selectedDateStr} 日报保存成功，已同步写入本地 db.json 数据库！`, 'success');
      onLogChange();
    } else {
      showToast('❌ 保存失败，请确认后端 API 服务已正常开启！', 'error');
    }
  };

  // 快捷删除日志
  const handleQuickDelete = async () => {
    if (!selectedDateStr) return;
    if (confirm(`确定要删除 ${selectedDateStr} 的工作日志吗？`)) {
      const res = await deleteLog(selectedDateStr);
      if (res.success) {
        showToast(`${selectedDateStr} 的工作日志已删除。`, 'info');
        onLogChange();
        setQuickTitle('');
        setQuickContent('');
      } else {
        showToast('删除失败！', 'error');
      }
    }
  };

  // 复制文本
  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`${field === 'title' ? '标题' : '内容'}已成功复制到剪贴板`, 'info');
    setTimeout(() => setCopiedField(null), 1500);
  };

  // 统计近期考核状况
  const getStatistics = () => {
    let missingCount = 0;
    let urgencyCount = 0;

    // 检查滚动窗口内的每一个非周末日期
    for (let i = 0; i < rollingDays; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateStr(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const hasLog = !!appData.logs[dateStr];

      if (!isWeekend && !hasLog) {
        missingCount++;
        // 如果是最后的补录期限（剩 0, 1, 2 天过期）
        if ((rollingDays - 1 - i) <= 2) {
          urgencyCount++;
        }
      }
    }

    return { missingCount, urgencyCount };
  };

  const getMissingDays = (): { dateStr: string; dayName: string; daysLeftToFill: number }[] => {
    const list = [];
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < rollingDays; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateStr(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const hasLog = !!appData.logs[dateStr];

      if (!isWeekend && !hasLog) {
        list.push({
          dateStr,
          dayName: dayNames[date.getDay()],
          daysLeftToFill: (rollingDays - 1) - i
        });
      }
    }
    return list.reverse(); // 从旧到新排列，最紧急的排最前面
  };

  const stats = getStatistics();
  const missingDays = getMissingDays();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
      {/* 绩效看板状态栏 */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderLeft: stats.missingCount > 0 ? '4px solid #EF4444' : '4px solid #10B981',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ minWidth: '280px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800' }}>7天滚动补录监控看板</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            根据公司考勤标准，滚动 7 天窗口期为：
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {formatDateStr(sevenDaysAgo)}
            </span>{' '}
            至{' '}
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {formatDateStr(today)}
            </span>。
          </p>
        </div>

        {/* 漏填列表快速导航区 */}
        {missingDays.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '320px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              🔍 漏填补录导航（含跨月）：
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {missingDays.map((day) => {
                const isSelected = selectedDateStr === day.dateStr;
                const isUrgent = day.daysLeftToFill <= 2;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDateStr(day.dateStr);
                      setQuickTitle('');
                      setQuickContent('');
                      setQuickHours(8);
                      setQuickCooperation(false);
                      setQuickDifficulty(false);
                    }}
                    className="clickable"
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: isSelected
                        ? 'var(--accent-gradient)'
                        : isUrgent
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                      border: isSelected
                        ? '1px solid transparent'
                        : isUrgent
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(245, 158, 11, 0.4)',
                      color: isSelected
                        ? '#ffffff'
                        : isUrgent
                        ? '#EF4444'
                        : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.2)' : 'none'
                    }}
                  >
                    <span>{day.dateStr.substring(5)} ({day.dayName})</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>
                      ({day.daysLeftToFill <= 0 ? '今天过期' : `剩 ${day.daysLeftToFill} 天`})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>漏记漏填天数：</span>
            <span
              style={{
                fontSize: '22px',
                fontWeight: '800',
                color: stats.missingCount > 0 ? '#EF4444' : '#10B981'
              }}
            >
              {stats.missingCount}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> 天</span>
          </div>
          {stats.urgencyCount > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={14} />
              <span>有 {stats.urgencyCount} 天即将过期！</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        {/* 左侧：日历主体 */}
        <div className="glass-panel" style={{ flex: 1.5, padding: '24px' }}>
          {/* 日历头部 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>
              {year} 年 {month + 1} 月
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevMonth}
                className="clickable"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleNextMonth}
                className="clickable"
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* 周名 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '10px',
              fontWeight: '600',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}
          >
            <div>一</div>
            <div>二</div>
            <div>三</div>
            <div>四</div>
            <div>五</div>
            <div style={{ color: '#F59E0B' }}>六</div>
            <div style={{ color: '#F59E0B' }}>日</div>
          </div>

          {/* 日期网格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {calendarCells.map((cell, index) => {
              const cellDateStr = formatDateStr(cell.date);
              const status = getDateStatus(cell.date);
              const isSelected = selectedDateStr === cellDateStr;

              // 网格基础背景色与边框
              let border = '1px solid var(--glass-border)';
              let background = 'rgba(255,255,255,0.01)';
              let opacity = cell.isCurrentMonth ? 1 : 0.4;
              let cursor = 'pointer';

              if (status.isFuture) {
                border = '1px dashed var(--glass-border)';
                background = 'transparent';
                cursor = 'not-allowed';
              } else if (isSelected) {
                border = '2px solid var(--accent-color)';
                background = 'rgba(59, 130, 246, 0.08)';
              } else if (status.hasLog) {
                background = 'rgba(16, 185, 129, 0.04)';
              } else if (status.inWindow && !status.isWeekend) {
                // 可补填且未填：高亮警示
                background = status.daysLeftToFill <= 2 
                  ? 'rgba(239, 68, 68, 0.05)'  // 紧急红色
                  : 'rgba(245, 158, 11, 0.05)'; // 警告黄色
                border = status.daysLeftToFill <= 2
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.3)';
              }

              return (
                <div
                  key={index}
                  onClick={() => handleSelectDate(cell.date)}
                  className={status.isFuture ? '' : 'clickable'}
                  style={{
                    height: '80px',
                    padding: '8px',
                    borderRadius: '10px',
                    border,
                    background,
                    opacity,
                    cursor,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* 日期号 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                  >
                    <span style={{ color: status.isWeekend ? '#F59E0B' : 'var(--text-primary)', fontSize: cell.isCurrentMonth ? '14px' : '11px' }}>
                      {cell.isCurrentMonth
                        ? (cell.date.getDate() === 1 ? `${cell.date.getMonth() + 1}/${cell.date.getDate()}` : cell.date.getDate())
                        : `${cell.date.getMonth() + 1}/${cell.date.getDate()}`
                      }
                    </span>

                    {/* 状态徽标 */}
                    {status.hasLog ? (
                      <CheckCircle2 size={14} color="#10B981" />
                    ) : status.isFuture ? null : status.isWeekend ? (
                      <Coffee size={14} color="var(--text-muted)" />
                    ) : status.inWindow ? (
                      <AlertCircle
                        size={14}
                        color={status.daysLeftToFill <= 2 ? '#EF4444' : '#F59E0B'}
                        style={{ animation: 'pulse-slow 2s infinite' }}
                      />
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </div>

                  {/* 日历单元格内容缩略 */}
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      marginTop: '4px'
                    }}
                  >
                    {status.hasLog ? (
                      appData.logs[cellDateStr].title
                    ) : status.isFuture ? (
                      ''
                    ) : status.isWeekend ? (
                      '休息'
                    ) : status.inWindow ? (
                      <span
                        style={{
                          fontWeight: '600',
                          color: status.daysLeftToFill <= 2 ? '#EF4444' : '#F59E0B'
                        }}
                      >
                        余 {status.daysLeftToFill} 天过期
                      </span>
                    ) : (
                      '已过期'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：补录/详情卡片 */}
        <div
          className="glass-panel"
          style={{
            flex: 1.2,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {selectedDateStr ? (
            <>
              {/* 日期及基本提示 */}
              <div
                style={{
                  borderBottom: '1px solid var(--glass-border)',
                  paddingBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{selectedDateStr} 详情</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {appData.logs[selectedDateStr] ? '该日期已存在日志，可查看或删除。' : '该日期无记录，请在下方录入或补录。'}
                  </p>
                </div>
                {appData.logs[selectedDateStr] && (
                  <button
                    onClick={handleQuickDelete}
                    className="clickable"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>删除</span>
                  </button>
                )}
              </div>

              {/* 表单展示与录入 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {/* 日志标题 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#EAB308' }}>日志名称</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength={30}
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="例如：日常前端开发代码维护"
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => copyText(quickTitle, 'title')}
                      className="clickable"
                      style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)' }}
                    >
                      {copiedField === 'title' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* 工时、协作、难点并排 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#EAB308', display: 'block', marginBottom: '4px' }}>工时(h)</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={quickHours}
                      onChange={(e) => setQuickHours(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="q_cooperation"
                      checked={quickCooperation}
                      onChange={(e) => setQuickCooperation(e.target.checked)}
                      style={{ marginRight: '4px', cursor: 'pointer' }}
                    />
                    <label htmlFor="q_cooperation" style={{ fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>协作</label>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <input
                      type="checkbox"
                      id="q_difficulty"
                      checked={quickDifficulty}
                      onChange={(e) => setQuickDifficulty(e.target.checked)}
                      style={{ marginRight: '4px', cursor: 'pointer' }}
                    />
                    <label htmlFor="q_difficulty" style={{ fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer' }}>难点</label>
                  </div>
                </div>

                {/* 日志内容 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#EAB308' }}>日志内容</label>
                  <div style={{ position: 'relative', display: 'flex', flex: 1 }}>
                    <textarea
                      maxLength={3000}
                      value={quickContent}
                      onChange={(e) => setQuickContent(e.target.value)}
                      placeholder="在此输入详细工作，或在下方点击一键补录"
                      style={{
                        width: '100%',
                        resize: 'none',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        minHeight: '160px'
                      }}
                    />
                    <button
                      onClick={() => copyText(quickContent, 'content')}
                      className="clickable"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '8px',
                        padding: '6px',
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        color: '#ffffff'
                      }}
                    >
                      {copiedField === 'content' ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 动作按钮组 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '12px'
                }}
              >
                {!appData.logs[selectedDateStr] ? (
                  <>
                    <button
                      onClick={handleQuickAutoGenerate}
                      className="clickable"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>⚡ 自动补填</span>
                    </button>
                    <button
                      onClick={handleQuickSave}
                      className="clickable"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'var(--accent-gradient)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>保存补录</span>
                    </button>
                  </>
                ) : (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      onClick={() => {
                        const text = `日志名称：${quickTitle}\n工时(h)：${quickHours}\n日志日期：${selectedDateStr}\n部门协作：${quickCooperation ? '是' : '否'}\n工作难点：${quickDifficulty ? '是' : '否'}\n日志内容：\n${quickContent}`;
                        copyText(text, 'all_info');
                      }}
                      className="clickable"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedField === 'all_info' ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      <span>{copiedField === 'all_info' ? '已复制' : '复制整单数据'}</span>
                    </button>
                    <button
                      onClick={handleQuickSave}
                      className="clickable"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'var(--accent-gradient)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      <span>修改并存盘</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                textAlign: 'center',
                gap: '12px',
                padding: '24px'
              }}
            >
              <HelpCircle size={40} style={{ opacity: 0.5 }} />
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '15px' }}>选择日期查看详情</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  点击左侧日历中任何已记录（绿勾）或漏填（黄/红叹号）的日期，即可在此处查看详情、复制或者一键补录。
                </p>
              </div>
              <button
                onClick={onNavigateToGenerator}
                className="clickable"
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--accent-gradient)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                去写今日日报
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
