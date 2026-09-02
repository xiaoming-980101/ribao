import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import DailyGenerator from './components/DailyGenerator';
import HistoryCalendar from './components/HistoryCalendar';
import WeeklyGenerator from './components/WeeklyGenerator';
import Settings from './components/Settings';
import LoginModal from './components/LoginModal';
import { fetchAllData, AppData } from './utils/storage';
import { CheckCircle2, AlertTriangle, Info, Menu, PenSquare, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  tab: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tab component error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.tab !== this.props.tab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="liquid-glass-card" style={{ padding: '32px', textAlign: 'center', margin: 'auto', maxWidth: '500px' }}>
          <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>视图加载遇到异常</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
            {this.state.error?.message || '渲染组件时发生意外错误，请尝试刷新。'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="clickable"
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            <span>重新加载当前视图</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('generator');
  const [theme, setTheme]           = useState<'light' | 'dark'>('dark');
  const [isOffline, setIsOffline]   = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile]     = useState<boolean>(window.innerWidth <= 768);

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
    showToast('您已成功退出登录，敏感密钥与数据已彻底隔离擦除！', 'info');
    setAppData({
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
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => (prev ? { ...prev, show: false } : null)), 3000);
  };

  const loadData = async () => {
    const result = await fetchAllData();
    if (result && result.data) {
      setAppData({
        logs: result.data.logs || {},
        settings: result.data.settings || {
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
    }
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

  if (!username) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ambient-light-canvas">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
        </div>

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
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="ambient-light-canvas">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="打开菜单">
          <Menu size={20} />
        </button>
        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <PenSquare size={18} color="#fff" />
          </div>
          <div>
            <div className="topbar-title">DevTask Pro</div>
          </div>
        </div>
      </header>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

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

      <main className="main-content">
        <TabErrorBoundary tab={currentTab}>
          {renderContent()}
        </TabErrorBoundary>
      </main>

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
