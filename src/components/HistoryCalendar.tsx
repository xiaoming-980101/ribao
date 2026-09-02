import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Copy,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  Save,
  Upload,
  FileSpreadsheet,
  X,
  Clock,
  ArrowRight,
  History as HistoryIcon,
  RotateCcw,
  Trash
} from 'lucide-react';
import { AppData, deleteLog, saveLog, restoreLog, clearTrash } from '../utils/storage';
import { generateRandomFrontendDaily } from '../utils/generator';
import { parseExcelFile, batchSaveImportedLogs, ParsedImportDay } from '../utils/excelImporter';

interface HistoryCalendarProps {
  appData: AppData;
  onLogChange: () => void;
  onNavigateToGenerator: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HistoryCalendar({
  appData,
  onLogChange,
  onNavigateToGenerator: _onNavigateToGenerator,
  showToast
}: HistoryCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ── 回收站与历史版本状态 ──
  const [trashOpen, setTrashOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 补录快速表单状态
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickHours, setQuickHours] = useState(8);
  const [quickCooperation, setQuickCooperation] = useState(false);
  const [quickDifficulty, setQuickDifficulty] = useState(false);

  // ── Excel 导入相关状态 ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedImportDays, setParsedImportDays] = useState<ParsedImportDay[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  // 安全获取 logs 和 settings
  const logs = (appData && appData.logs) ? appData.logs : {};
  const trash = (appData && appData.trash) ? appData.trash : {};
  const settings = (appData && appData.settings) ? appData.settings : {
    job: 'frontend',
    tone: 'professional',
    rollingDays: 7
  };

  // 基础时间计算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rollingDays = settings.rollingDays || 7;
  const sevenDaysAgo = new Date(today.getTime() - (rollingDays - 1) * 24 * 60 * 60 * 1000);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells = [];

  const daysToPad = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  for (let i = daysToPad; i > 0; i--) {
    const d = prevMonthDays - i + 1;
    const prevMonthDate = new Date(year, month - 1, d);
    calendarCells.push({
      date: prevMonthDate,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    calendarCells.push({
      date,
      isCurrentMonth: true
    });
  }

  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    calendarCells.push({
      date: nextDate,
      isCurrentMonth: false
    });
  }

  const formatDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateStatus = (date: Date) => {
    date.setHours(0, 0, 0, 0);
    const dateStr = formatDateStr(date);
    const hasLog = !!logs[dateStr];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isFuture = date > today;
    const inWindow = date >= sevenDaysAgo && date <= today;

    let daysLeftToFill = 0;
    if (inWindow && !hasLog && !isWeekend) {
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      daysLeftToFill = (rollingDays - 1) - diffDays;
    }

    return {
      hasLog,
      isWeekend,
      isFuture,
      inWindow,
      daysLeftToFill
    };
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (date: Date) => {
    const status = getDateStatus(date);
    if (status.isFuture) return;

    const dateStr = formatDateStr(date);
    setSelectedDateStr(dateStr);

    if (logs[dateStr]) {
      const log = logs[dateStr];
      setQuickTitle(log.title || '');
      setQuickContent(log.content || '');
      setQuickHours(log.hours || 8);
      setQuickCooperation(!!log.cooperation);
      setQuickDifficulty(!!log.difficulty);
    } else {
      setQuickTitle('');
      setQuickContent('');
      setQuickHours(8);
      setQuickCooperation(false);
      setQuickDifficulty(false);
    }
  };

  const handleQuickAutoGenerate = () => {
    if (!selectedDateStr) return;
    const currentJob = settings.job || 'frontend';
    const result = generateRandomFrontendDaily(selectedDateStr, false, currentJob);
    setQuickTitle(result.title);
    setQuickHours(result.hours);
    setQuickCooperation(result.cooperation);
    setQuickDifficulty(result.difficulty);
    setQuickContent(result.content);
  };

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
      job: settings.job || 'frontend',
      tone: settings.tone || 'professional',
      isAutoGenerated: true
    };

    const res = await saveLog(selectedDateStr, logData);
    if (res.success) {
      showToast(`${selectedDateStr} 日报保存成功，已同步写入数据库！`, 'success');
      onLogChange();
    } else {
      showToast('保存失败，请确认后端 API 服务已正常开启！', 'error');
    }
  };

  const handleQuickDelete = async () => {
    if (!selectedDateStr) return;
    if (confirm(`确定要将 ${selectedDateStr} 的工作日志移入回收站吗？\n\n移入回收站后可在右侧「回收站」中随时恢复。`)) {
      const res = await deleteLog(selectedDateStr);
      if (res.success) {
        showToast(`${selectedDateStr} 的工作日志已移入回收站。`, 'info');
        onLogChange();
        setQuickTitle('');
        setQuickContent('');
        setShowHistory(false);
      } else {
        showToast('删除失败！', 'error');
      }
    }
  };

  // ── 回收站操作：恢复单条 / 清空 ──
  const handleRestoreLog = async (date: string) => {
    const res = await restoreLog(date);
    if (res.success) {
      showToast(`${date} 的日志已从回收站恢复！`, 'success');
      onLogChange();
    } else {
      showToast('恢复失败！', 'error');
    }
  };

  const handleClearTrash = async () => {
    const trashCount = Object.keys(trash || {}).length;
    if (trashCount === 0) return;
    if (confirm(`确定要永久清空回收站中的 ${trashCount} 条日志吗？\n\n此操作不可恢复！`)) {
      const res = await clearTrash();
      if (res.success) {
        showToast('回收站已清空。', 'info');
        onLogChange();
      } else {
        showToast('清空回收站失败！', 'error');
      }
    }
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`${field === 'title' ? '标题' : '内容'}已成功复制到剪贴板`, 'info');
    setTimeout(() => setCopiedField(null), 1500);
  };

  // ── Excel 上传与解析 ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processExcelFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      showToast('正在解析任务导出 Excel 文件...', 'info');
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        showToast('未在文件中识别到有效的工作任务日期与内容！', 'error');
        return;
      }
      setParsedImportDays(parsed);
      setImportModalOpen(true);
    } catch (err: any) {
      console.error('解析 Excel 失败:', err);
      showToast(`解析 Excel 文件失败: ${err.message || '格式不受支持'}`, 'error');
    }
  };

  const handleConfirmBatchImport = async () => {
    if (parsedImportDays.length === 0) return;
    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedImportDays.length });

    try {
      const { successCount, failCount } = await batchSaveImportedLogs(
        parsedImportDays,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );

      if (successCount > 0) {
        showToast(`成功导入并覆盖 ${successCount} 天的工作日志！`, 'success');
        onLogChange();
        setImportModalOpen(false);

        // 如果导入的最新的日期有效，自动跳转到该月并选中最新日期
        const lastDay = parsedImportDays[parsedImportDays.length - 1];
        if (lastDay && lastDay.date) {
          const parts = lastDay.date.split('-');
          if (parts.length === 3) {
            setCurrentDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
            setSelectedDateStr(lastDay.date);
            setQuickTitle(lastDay.title);
            setQuickContent(lastDay.content);
            setQuickHours(lastDay.hours);
            setQuickCooperation(lastDay.cooperation);
            setQuickDifficulty(lastDay.difficulty);
          }
        }
      } else {
        showToast(`导入失败，失败条数: ${failCount}`, 'error');
      }
    } catch (e: any) {
      showToast(`批量导入发生异常: ${e.message}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatistics = () => {
    let missingCount = 0;
    let urgencyCount = 0;
    let filledCount = 0;

    for (let i = 0; i < rollingDays; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateStr(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const hasLog = !!logs[dateStr];

      if (hasLog) filledCount++;
      if (!isWeekend && !hasLog) {
        missingCount++;
        if ((rollingDays - 1 - i) <= 2) {
          urgencyCount++;
        }
      }
    }

    return { missingCount, urgencyCount, filledCount };
  };

  const getMissingDays = (): { dateStr: string; dayName: string; daysLeftToFill: number }[] => {
    const list = [];
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    for (let i = 0; i < rollingDays; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateStr(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const hasLog = !!logs[dateStr];

      if (!isWeekend && !hasLog) {
        list.push({
          dateStr,
          dayName: dayNames[date.getDay()],
          daysLeftToFill: (rollingDays - 1) - i
        });
      }
    }
    return list.reverse();
  };

  const stats = getStatistics();
  const missingDays = getMissingDays();

  // 隐藏文件上传 input
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', flex: 1 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx, .xls, .csv"
        style={{ display: 'none' }}
      />

      {/* 苹果 Bento 看板状态栏 */}
      <div
        className="liquid-glass-card"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          borderLeft: stats.missingCount > 0 ? '4px solid #EF4444' : '4px solid #10B981'
        }}
      >
        <div style={{ minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <CalendarIcon size={18} color="var(--accent-color)" />
            <h2 style={{ fontSize: '17px', fontWeight: '800' }}>工时与事项归档监控看板</h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            归档统计周期：
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatDateStr(sevenDaysAgo)}
            </span>{' '}
            至{' '}
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
              {formatDateStr(today)}
            </span>
          </p>
        </div>

        {/* 漏填快速胶囊导航 */}
        {missingDays.length > 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              待归档事项快捷通道:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {missingDays.map((day) => {
                const isSelected = selectedDateStr === day.dateStr;
                const isUrgent = day.daysLeftToFill <= 2;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDateStr(day.dateStr);
                      if (logs[day.dateStr]) {
                        const l = logs[day.dateStr];
                        setQuickTitle(l.title || '');
                        setQuickContent(l.content || '');
                        setQuickHours(l.hours || 8);
                        setQuickCooperation(!!l.cooperation);
                        setQuickDifficulty(!!l.difficulty);
                      } else {
                        setQuickTitle('');
                        setQuickContent('');
                        setQuickHours(8);
                        setQuickCooperation(false);
                        setQuickDifficulty(false);
                      }
                    }}
                    className="clickable"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: isSelected
                        ? 'var(--accent-gradient)'
                        : isUrgent
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(245, 158, 11, 0.12)',
                      border: isSelected
                        ? '1px solid rgba(255,255,255,0.3)'
                        : isUrgent
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : '1px solid rgba(245, 158, 11, 0.35)',
                      color: isSelected
                        ? '#ffffff'
                        : isUrgent
                        ? '#EF4444'
                        : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 4px 12px var(--accent-glow)' : 'none'
                    }}
                  >
                    <span>{day.dateStr.substring(5)} ({day.dayName})</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>
                      ({day.daysLeftToFill <= 0 ? '今日截止' : `剩 ${day.daysLeftToFill} 天`})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 🌟 核心新功能：一键导入任务日志 Excel 按钮 🌟 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="clickable"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: 'var(--glass-surface-subtle)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
            }}
            title="支持上传后台导出的任务列表 Excel，一键覆盖同步至对应工作日"
          >
            <FileSpreadsheet size={16} color="var(--accent-color)" />
            <span>一键导入任务清单 (Excel)</span>
          </button>

          {/* 回收站入口 */}
          <button
            onClick={() => setTrashOpen(true)}
            className="clickable"
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: Object.keys(trash).length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-surface-subtle)',
              border: '1px solid ' + (Object.keys(trash).length > 0 ? 'rgba(239, 68, 68, 0.35)' : 'var(--glass-border)'),
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
            }}
            title="查看已移入回收站（软删除）的日志，支持一键恢复"
          >
            <Trash2 size={16} color={Object.keys(trash).length > 0 ? '#EF4444' : 'var(--text-secondary)'} />
            <span>回收站</span>
            {Object.keys(trash).length > 0 && (
              <span
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '800',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}
              >
                {Object.keys(trash).length}
              </span>
            )}
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>待归档天数</div>
            <div style={{
              fontSize: '22px',
              fontWeight: '800',
              color: stats.missingCount > 0 ? '#EF4444' : '#10B981',
              lineHeight: '1.2'
            }}>
              {stats.missingCount} <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>天</span>
            </div>
          </div>
          {stats.urgencyCount > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '8px 12px',
                borderRadius: '12px',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <AlertCircle size={15} />
              <span>{stats.urgencyCount} 天临期</span>
            </div>
          )}
        </div>
      </div>

      <div className="two-col-layout">
        {/* 左侧：日历 42 单元格矩阵 (支持拖拽 Excel 上传) */}
        <div
          className="liquid-glass-card two-col-left"
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            padding: '24px',
            position: 'relative',
            border: isDragOver ? '2px dashed var(--accent-color)' : undefined
          }}
        >
          {isDragOver && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(99, 102, 241, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              zIndex: 20
            }}>
              <Upload size={40} color="var(--accent-color)" />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>释放鼠标即可解析 Excel 文件并一键覆盖导入</div>
            </div>
          )}

          {/* 日历导航头部 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                {year} 年 {month + 1} 月
              </h3>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevMonth}
                className="clickable"
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--glass-surface-subtle)',
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
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'var(--glass-surface-subtle)',
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
              marginBottom: '12px',
              fontWeight: '700',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}
          >
            <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
          </div>

          {/* 42 格矩阵 */}
          <div className="calendar-grid">
            {calendarCells.map((cell, idx) => {
              const status = getDateStatus(cell.date);
              const dateStr = formatDateStr(cell.date);
              const isSelected = selectedDateStr === dateStr;
              const isToday = formatDateStr(today) === dateStr;

              let cellBg = 'var(--glass-surface-subtle)';
              let borderColor = 'var(--glass-border-subtle)';
              let textColor = cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)';

              if (status.hasLog) {
                cellBg = 'rgba(16, 185, 129, 0.12)';
                borderColor = 'rgba(16, 185, 129, 0.3)';
              } else if (status.inWindow && !status.isWeekend) {
                cellBg = 'rgba(245, 158, 11, 0.12)';
                borderColor = 'rgba(245, 158, 11, 0.35)';
              }

              if (isSelected) {
                cellBg = 'var(--accent-gradient)';
                borderColor = 'rgba(255, 255, 255, 0.4)';
                textColor = '#ffffff';
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectDate(cell.date)}
                  className={`clickable ${status.isFuture ? '' : 'cursor-pointer'}`}
                  style={{
                    minHeight: '64px',
                    padding: '8px',
                    borderRadius: '12px',
                    background: cellBg,
                    border: `1px solid ${borderColor}`,
                    color: textColor,
                    opacity: status.isFuture ? 0.35 : cell.isCurrentMonth ? 1 : 0.6,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    cursor: status.isFuture ? 'not-allowed' : 'pointer',
                    boxShadow: isSelected ? '0 8px 20px var(--accent-glow)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: isToday ? '800' : '600' }}>
                      {cell.date.getDate()}
                    </span>
                    {isToday && (
                      <span style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--accent-color)',
                        color: '#fff',
                        fontWeight: '700'
                      }}>
                        今
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '10px', marginTop: '4px' }}>
                    {status.hasLog ? (
                      <span style={{ color: isSelected ? '#fff' : '#10B981', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '700' }}>
                        <CheckCircle2 size={10} /> 已填
                      </span>
                    ) : status.inWindow && !status.isWeekend ? (
                      <span style={{ color: isSelected ? '#fff' : '#F59E0B', fontWeight: '700' }}>
                        待归档
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：补录/查看详情工作台 */}
        <div className="liquid-glass-card two-col-right" style={{ padding: '26px 24px' }}>
          {selectedDateStr ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarIcon size={18} color="var(--accent-color)" />
                  <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                    {selectedDateStr} 事项详情与归档
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {!logs[selectedDateStr] && (
                    <button
                      onClick={handleQuickAutoGenerate}
                      className="clickable"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '10px',
                        background: 'var(--accent-gradient)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px var(--accent-glow)'
                      }}
                    >
                      <Sparkles size={14} />
                      <span>载入默认事项</span>
                    </button>
                  )}
                  {logs[selectedDateStr] && (
                    <button
                      onClick={() => setShowHistory((v) => !v)}
                      className="clickable"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '10px',
                        background: showHistory ? 'rgba(16, 185, 129, 0.12)' : 'var(--glass-surface-subtle)',
                        border: '1px solid ' + (showHistory ? 'rgba(16, 185, 129, 0.35)' : 'var(--glass-border)'),
                        color: showHistory ? '#10B981' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <HistoryIcon size={14} />
                      <span>历史版本</span>
                      {(logs[selectedDateStr]?.history?.length || 0) > 0 && (
                        <span
                          style={{
                            background: '#10B981',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: '800',
                            minWidth: '14px',
                            height: '14px',
                            borderRadius: '7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 3px'
                          }}
                        >
                          {(logs[selectedDateStr]?.history?.length || 0)}
                        </span>
                      )}
                    </button>
                  )}
                  {logs[selectedDateStr] && (
                    <button
                      onClick={handleQuickDelete}
                      className="clickable"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                      <span>删除</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 历史版本面板：查看该日期日志的修改历史快照 */}
              {showHistory &&
                (() => {
                  const current = logs[selectedDateStr];
                  const historyList = current?.history ? [...current.history].reverse() : [];
                  return (
                    <div
                      style={{
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        background: 'var(--glass-surface-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        maxHeight: '240px',
                        overflowY: 'auto'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        <HistoryIcon size={13} color="#10B981" />
                        <span>修改历史（共 {historyList.length} 个旧版本，最新在上）</span>
                      </div>
                      {historyList.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>该日志暂无历史版本，之后每次覆盖保存都会在此留档一份快照。</p>
                      ) : (
                        historyList.map((h, idx) => (
                          <div
                            key={idx}
                            style={{
                              border: '1px solid var(--glass-border-subtle)',
                              borderRadius: '8px',
                              padding: '10px 12px',
                              fontSize: '12px',
                              background: 'var(--glass-surface-subtle)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                {h.title || '日常工作日志'}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} />
                                {h.versionAt ? new Date(h.versionAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '历史快照'}
                              </span>
                            </div>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                              {h.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

              {/* 表单字段 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>事项名称:</label>
                  <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="填写工作事项名称..."
                      style={{ flex: 1 }}
                    />
                    {quickTitle && (
                      <button
                        onClick={() => copyText(quickTitle, 'title')}
                        className="clickable"
                        style={{
                          padding: '10px',
                          background: 'var(--glass-surface-subtle)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '10px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {copiedField === 'title' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ width: '80px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>工时(h):</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={quickHours}
                    onChange={(e) => setQuickHours(Number(e.target.value))}
                    style={{ maxWidth: '140px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ width: '80px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>工作事项内容:</label>
                  <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
                    <textarea
                      value={quickContent}
                      onChange={(e) => setQuickContent(e.target.value)}
                      placeholder="填写工作事项内容流水..."
                      style={{
                        flex: 1,
                        resize: 'none',
                        lineHeight: '1.7',
                        minHeight: '160px'
                      }}
                    />
                    {quickContent && (
                      <button
                        onClick={() => copyText(quickContent, 'content')}
                        className="clickable"
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '10px',
                          padding: '8px',
                          background: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          color: '#ffffff',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        {copiedField === 'content' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 底部保存按钮 */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '14px' }}>
                <button
                  onClick={handleQuickSave}
                  className="clickable"
                  style={{
                    padding: '11px 22px',
                    borderRadius: '12px',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 24px var(--accent-glow)'
                  }}
                >
                  <Save size={15} />
                  <span>保存事项</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              height: '100%',
              minHeight: '280px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '12px',
              textAlign: 'center'
            }}>
              <CalendarIcon size={36} color="var(--text-muted)" opacity={0.5} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>请在左侧日历点击选择任意一天</div>
              <div style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.6 }}>
                支持快速查看历史日志、跨月补填漏报日报，或一键导入 Excel 任务。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🌟 visionOS 悬浮液态模态框：Excel 批量导入确认 🌟 */}
      {importModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div
            className="liquid-glass-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              maxHeight: '85vh',
              overflow: 'hidden'
            }}
          >
            {/* 模态框头部 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}>
                  <FileSpreadsheet size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>工作事项清单 Excel 解析确认</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    已成功解析待导入的实际工作任务清单
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isImporting && setImportModalOpen(false)}
                className="clickable"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 统计指标看板 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              background: 'var(--glass-surface-subtle)',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>解析工作日天数</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-color)', marginTop: '2px' }}>
                  {parsedImportDays.length} <span style={{ fontSize: '11px', fontWeight: '500' }}>天</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>覆盖工时累计</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10B981', marginTop: '2px' }}>
                  {Math.round(parsedImportDays.reduce((sum, d) => sum + d.hours, 0) * 10) / 10} <span style={{ fontSize: '11px', fontWeight: '500' }}>h</span>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>覆盖模式</div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#F59E0B', marginTop: '6px' }}>
                  直接覆盖已有
                </div>
              </div>
            </div>

            {/* 警告提示 */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} />
              <span>导入后将以 Excel 为准，直接覆盖对应日期的历史日志内容。</span>
            </div>

            {/* 解析预览列表 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
              maxHeight: '220px'
            }}>
              {parsedImportDays.map((d, i) => (
                <div
                  key={d.date || i}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--glass-surface-subtle)',
                    border: '1px solid var(--glass-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: '800', color: 'var(--accent-color)' }}>{d.date}</span>
                    <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {d.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px', flexShrink: 0 }}>
                    <Clock size={11} />
                    <span>{d.hours}h</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 导入进度条 */}
            {isImporting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <span>正在批量写入数据库...</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--glass-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(importProgress.current / (importProgress.total || 1)) * 100}%`,
                    height: '100%',
                    background: 'var(--accent-gradient)',
                    transition: 'width 0.1s ease'
                  }} />
                </div>
              </div>
            )}

            {/* 模态框底部操作 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={() => setImportModalOpen(false)}
                disabled={isImporting}
                className="clickable"
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchImport}
                disabled={isImporting}
                className="clickable glow-btn"
                style={{
                  padding: '9px 22px',
                  borderRadius: '10px',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 16px var(--accent-glow)',
                  cursor: isImporting ? 'not-allowed' : 'pointer'
                }}
              >
                <span>{isImporting ? '正在批量覆盖导入...' : '确认覆盖导入'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回收站弹窗：查看已软删除日志，支持恢复 / 清空 */}
      {trashOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div
            className="liquid-glass-card"
            style={{
              width: '100%',
              maxWidth: '620px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              borderRadius: '24px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              maxHeight: '85vh',
              overflow: 'hidden'
            }}
          >
            {/* 头部 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)'
                }}>
                  <Trash2 size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>回收站</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    软删除的日志保存在此，可随时恢复或永久清除
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrashOpen(false)}
                className="clickable"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* 列表 */}
            {Object.keys(trash).length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Trash size={26} color="var(--text-muted)" />
                <span>回收站空空如也，删除的日志会出现在这里。</span>
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {Object.entries(trash)
                  .sort((a, b) => (b[1].deletedAt || '').localeCompare(a[1].deletedAt || ''))
                  .map(([date, log]) => (
                    <div
                      key={date}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'var(--glass-surface-subtle)',
                        border: '1px solid var(--glass-border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--accent-color)', flexShrink: 0 }}>{date}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.title || '日常工作日志'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px' }}>
                          <Clock size={10} />
                          <span>删除于 {log.deletedAt ? new Date(log.deletedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '未知时间'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRestoreLog(date)}
                        className="clickable"
                        style={{
                          flexShrink: 0,
                          padding: '7px 14px',
                          borderRadius: '10px',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#10B981',
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={13} />
                        <span>恢复</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* 底部操作 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={handleClearTrash}
                disabled={Object.keys(trash).length === 0}
                className="clickable"
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: Object.keys(trash).length === 0 ? 'not-allowed' : 'pointer',
                  opacity: Object.keys(trash).length === 0 ? 0.5 : 1
                }}
              >
                <Trash2 size={14} />
                <span>永久清空回收站</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
