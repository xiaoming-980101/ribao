import React, { useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import DailyGenerator from './components/DailyGenerator';
import HistoryCalendar from './components/HistoryCalendar';
import WeeklyGenerator from './components/WeeklyGenerator';
import Settings from './components/Settings';
import LoginModal from './components/LoginModal';
import {
  fetchAllData,
  AppData,
  syncOfflineOperations,
  removeAuthToken,
  DEFAULT_SETTINGS,
  AUTH_EXPIRED_EVENT
} from './utils/storage';
import { clearAllDrafts } from './utils/draft';
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
    trash: {},
    reports: {},
    settings: { ...DEFAULT_SETTINGS }
  });

  const handleLoginSuccess = (user: string, settings: any) => {
    setUsername(user);
    if (settings) {
      setAppData((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    }
    loadData();
  };

  const handleLogout = () => {
    if (username) {
      clearAllDrafts(username);
      localStorage.removeItem(`winner_daily_ai_settings_${username}`);
    }
    removeAuthToken();
    localStorage.removeItem('winner_daily_user');
    localStorage.removeItem('winner_daily_ai_settings');
    setUsername(null);
    showToast('您已成功退出登录，敏感密钥与数据已彻底隔离擦除！', 'info');
    setAppData({
      logs: {},
      trash: {},
      reports: {},
      settings: { ...DEFAULT_SETTINGS }
    });
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => (prev ? { ...prev, show: false } : null)), 3000);
  }, []);

  const loadData = useCallback(async () => {
    const result = await fetchAllData();
    if (result && result.data) {
      setAppData({
        logs: result.data.logs || {},
        trash: result.data.trash || {},
        reports: result.data.reports || {},
        settings: result.data.settings || { ...DEFAULT_SETTINGS }
      });
    }
    setIsOffline(result.isOffline);
    // 服务端明确拒绝（非网络不可达）时必须让用户知道，而不是静默展示本地陈旧数据
    if (result.error) {
      showToast(`读取服务端数据失败：${result.error}`, 'error');
    }
  }, [showToast]);

  /**
   * 登录凭证失效（401/403）时由 storage 层派发事件统一收敛：
   * 退回登录页，同时保留离线队列，用户重新登录后可完整回放，
   * 避免此前「请求持续 401 却静默当成离线」的情况。
   */
  const handleAuthExpired = useCallback((reason?: string) => {
    setUsername((prev) => {
      if (!prev) return prev;
      localStorage.removeItem('winner_daily_user');
      showToast(reason || '登录凭证已失效，请重新登录。', 'error');
      return null;
    });
  }, [showToast]);

  useEffect(() => {
    loadData();

    // 离线队列回放结果统一上报：成功、被永久拒绝而丢弃、以及卡住的原因
    const reportSync = (prefix: string) => (result: Awaited<ReturnType<typeof syncOfflineOperations>>) => {
      if (result.successCount > 0) {
        showToast(`${prefix}已同步 ${result.successCount} 条离线操作，数据已落盘`, 'success');
        loadData();
      }
      if (result.droppedCount > 0) {
        showToast(`${result.droppedCount} 条离线操作被服务端拒绝已丢弃：${result.lastError || '原因未知'}`, 'error');
      } else if (result.failCount > 0 && result.lastError) {
        showToast(`仍有 ${result.failCount} 条离线操作待同步：${result.lastError}`, 'info');
      }
    };

    // 离线队列自动同步（挂载时检测）
    syncOfflineOperations().then(reportSync(''));

    // 网络恢复时自动回放离线队列
    const handleOnline = () => {
      syncOfflineOperations().then(reportSync('网络已恢复，'));
    };
    window.addEventListener('online', handleOnline);

    // 登录凭证失效事件（由 storage 层在收到 401/403 时派发）
    const onAuthExpired = (ev: Event) => {
      const detail = (ev as CustomEvent<{ reason?: string }>).detail;
      handleAuthExpired(detail && detail.reason);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);

    // 监听跨标签页同步完成事件（其他标签页完成离线回放时刷新数据）
    try {
      const syncChannel = new BroadcastChannel('winner-daily-sync');
      syncChannel.onmessage = (ev) => {
        if (ev.data && ev.data.type === 'synced') {
          loadData();
        }
      };
      (window as any).__winnerDailySyncChannel = syncChannel;
    } catch (e) {
      // BroadcastChannel 不支持时忽略
    }

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
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
      try {
        const chan = (window as any).__winnerDailySyncChannel;
        if (chan) chan.close();
      } catch (_e) {
        // ignore close error
      }
    };
  }, [loadData, handleAuthExpired, showToast]);

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
        return <WeeklyGenerator appData={appData} showToast={showToast} />;
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
          <div className="ambient-grid-matrix" />
          <div className="ambient-beam-ray" />
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
          <div className="ambient-orb ambient-orb-3" />
          <div className="ambient-orb ambient-orb-4" />
        </div>

        <div className="view-enter-transition" style={{ width: '100%', maxWidth: '440px', padding: '0 20px', zIndex: 1 }}>
          <LoginModal onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        </div>
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
        <div className="ambient-grid-matrix" />
        <div className="ambient-beam-ray" />
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="ambient-orb ambient-orb-4" />
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
          <div key={currentTab} className="view-enter-transition" style={{ width: '100%' }}>
            {renderContent()}
          </div>
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
