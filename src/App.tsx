import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyGenerator from './components/DailyGenerator';
import HistoryCalendar from './components/HistoryCalendar';
import WeeklyGenerator from './components/WeeklyGenerator';
import Settings from './components/Settings';
import { fetchAllData, AppData } from './utils/storage';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('generator');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [appData, setAppData] = useState<AppData>({
    logs: {},
    settings: {
      job: 'frontend',
      tone: 'professional',
      similarityThreshold: 50,
      rollingDays: 7
    }
  });

  // 全局 Toast 状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
    }, 2800);
  };

  // 加载数据
  const loadData = async () => {
    const result = await fetchAllData();
    setAppData(result.data);
    setIsOffline(result.isOffline);
  };

  useEffect(() => {
    loadData();

    // 默认根据用户系统偏好或已有配置设置主题
    const savedTheme = localStorage.getItem('winner_daily_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // 监听主题变化，动态修改 HTML 属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('winner_daily_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 根据当前标签页渲染主视口
  const renderContent = () => {
    switch (currentTab) {
      case 'generator':
        return (
          <DailyGenerator
            appData={appData}
            onSaveSuccess={loadData}
            showToast={showToast}
          />
        );
      case 'calendar':
        return (
          <HistoryCalendar
            appData={appData}
            onLogChange={loadData}
            onNavigateToGenerator={() => setCurrentTab('generator')}
            showToast={showToast}
          />
        );
      case 'weekly':
        return (
          <WeeklyGenerator
            appData={appData}
          />
        );
      case 'settings':
        return (
          <Settings
            appData={appData}
            onSaveSuccess={loadData}
            showToast={showToast}
          />
        );
      default:
        return (
          <DailyGenerator
            appData={appData}
            onSaveSuccess={loadData}
            showToast={showToast}
          />
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={theme}
        toggleTheme={toggleTheme}
        isOffline={isOffline}
      />

      <main
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          padding: '16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {renderContent()}
      </main>

      {/* 全局 Toast 通知渲染容器 */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-item ${toast.show ? 'show' : ''} ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" />}
            {toast.type === 'error' && <AlertTriangle size={18} color="#EF4444" />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-color)" />}
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
