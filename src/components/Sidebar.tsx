import React from 'react';
import { PenSquare, Calendar, FileText, Settings, Sun, Moon, Database, CloudOff } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOffline: boolean;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  isOffline
}: SidebarProps) {
  const menuItems = [
    { id: 'generator', label: '日报生成器', icon: PenSquare },
    { id: 'calendar', label: '滚动补录日历', icon: Calendar },
    { id: 'weekly', label: '周报分类汇总', icon: FileText },
    { id: 'settings', label: '个性化配置', icon: Settings },
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '260px',
        margin: '16px 0 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        background: 'var(--sidebar-bg)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Logo 与标题 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div
            style={{
              background: 'var(--accent-gradient)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <PenSquare size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px' }}>赢日志</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Winner Daily</p>
          </div>
        </div>

        {/* 菜单项 */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className="clickable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '14px',
                  boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none'
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部状态及主题切换 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 数据源连接状态 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: isOffline ? '#EF4444' : '#10B981'
          }}
        >
          {isOffline ? <CloudOff size={14} /> : <Database size={14} />}
          <span>{isOffline ? 'LocalStorage 离线模式' : '本地 DB 服务已连接'}</span>
        </div>

        {/* 主题切换按钮 */}
        <div
          onClick={toggleTheme}
          className="clickable"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.05)',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'light' ? '明亮模式' : '暗黑模式'}</span>
          </div>
          <div
            style={{
              width: '32px',
              height: '18px',
              borderRadius: '9px',
              background: theme === 'light' ? '#d1d5db' : 'var(--accent-color)',
              position: 'relative',
              padding: '2px',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: theme === 'light' ? '2px' : '16px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
