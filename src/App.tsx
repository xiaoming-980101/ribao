import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyGenerator from './components/DailyGenerator';
import HistoryCalendar from './components/HistoryCalendar';
import WeeklyGenerator from './components/WeeklyGenerator';
import Settings from './components/Settings';
import LoginModal from './components/LoginModal';
import { fetchAllData, AppData } from './utils/storage';
import { CheckCircle2, AlertTriangle, Info, Menu, PenSquare } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('generator');
  const [theme, setTheme]           = useState<'light' | 'dark'>('dark');
  const [isOffline, setIsOffline]   = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile]     = useState<boolean>(window.innerWidth <= 768);

  // 核心用户登录态
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('winner_daily_user')
  );

  const [appData, setAppData] = useState<AppData>({
    logs: {},
    settings: {
      job: 'frontend',
      customJobName: '',
      tone: 'professional',
      similarityThreshold: 50,
      rollingDays: 7,
      aiEnabled: false,
      aiApiKey: '',
      aiApiUrl: 'https://openrouter.ai/api/v1',
      aiModel: 'openrouter/free',
      saveKeyToCloud: true
    }
  });

  const handleLoginSuccess = (user: string, settings: any) => {
    setUsername(user);
    if (settings) {
      setAppData((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    }
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem('winner_daily_user');
    if (username) localStorage.removeItem(`winner_daily_ai_settings_${username}`);
    localStorage.removeItem('winner_daily_ai_settings');
    setUsername(null);
    showToast('🚪 您已成功退出登录，敏感密钥与数据已彻底隔离擦除！', 'info');
    setAppData({
      logs: {},
      settings: {
        job: 'frontend', tone: 'professional',
        customJobName: '',
        similarityThreshold: 50, rollingDays: 7,
        aiEnabled: false, aiApiKey: '',
        aiApiUrl: 'https://openrouter.ai/api/v1',
        aiModel: 'openrouter/free',
        saveKeyToCloud: true
      }
    });
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => (prev ? { ...prev, show: false } : null)), 2800);
  };

  const loadData = async () => {
    const result = await fetchAllData();
    setAppData(result.data);
    setIsOffline(result.isOffline);
  };

  useEffect(() => {
    loadData();

    const savedTheme = localStorage.getItem('winner_daily_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('winner_daily_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const renderContent = () => {
    switch (currentTab) {
      case 'generator':
        return <DailyGenerator appData={appData} onSaveSuccess={loadData} showToast={showToast} onNavigateToTab={setCurrentTab} />;
      case 'calendar':
        return <HistoryCalendar appData={appData} onLogChange={loadData} onNavigateToGenerator={() => setCurrentTab('generator')} showToast={showToast} />;
      case 'weekly':
        return <WeeklyGenerator appData={appData} />;
      case 'settings':
        return <Settings appData={appData} onSaveSuccess={loadData} showToast={showToast} />;
      default:
        return <DailyGenerator appData={appData} onSaveSuccess={loadData} showToast={showToast} onNavigateToTab={setCurrentTab} />;
    }
  };

  // 未登录：显示登录弹窗
  if (!username) {
    return (
      <>
        <LoginModal onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        {toast && (
          <div className="toast-container">
            <div className={`toast-item ${toast.show ? 'show' : ''} ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" />}
              {toast.type === 'error'   && <AlertTriangle size={18} color="#EF4444" />}
              {toast.type === 'info'    && <Info size={18} color="var(--accent-color)" />}
              <span style={{ fontSize: '13px', fontWeight: '600' }}>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-layout">

      {/* ── 移动端顶部导航栏 ── */}
      <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="打开菜单">
          <Menu size={20} />
        </button>
        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <PenSquare size={16} color="#fff" />
          </div>
          <div>
            <div className="topbar-title">赢日志</div>
          </div>
        </div>
      </header>

      {/* ── 移动端遮罩层 ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── 侧边栏 (PC 固定 / 移动端抽屉) ── */}
      <div className={`sidebar-wrapper ${isMobile && sidebarOpen ? 'open' : ''}`}>
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          theme={theme}
          toggleTheme={toggleTheme}
          isOffline={isOffline}
          username={username}
          onLogout={handleLogout}
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── 主内容区 ── */}
      <main className="main-content">
        {renderContent()}
      </main>

      {/* ── 全局 Toast ── */}
      {toast && (
        <div className="toast-container">
          <div className={`toast-item ${toast.show ? 'show' : ''} ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="#10B981" />}
            {toast.type === 'error'   && <AlertTriangle size={18} color="#EF4444" />}
            {toast.type === 'info'    && <Info size={18} color="var(--accent-color)" />}
            <span style={{ fontSize: '13px', fontWeight: '600' }}>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
