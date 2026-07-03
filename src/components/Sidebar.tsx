import React from 'react';
import { PenSquare, Calendar, FileText, Settings, Sun, Moon, Database, CloudOff, X } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOffline: boolean;
  username: string | null;
  onLogout: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  isOffline,
  username,
  onLogout,
  isMobile,
  isOpen,
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'generator', label: '日报生成器', icon: PenSquare },
    { id: 'calendar', label: '滚动补录日历', icon: Calendar },
    { id: 'weekly', label: '周报分类汇总', icon: FileText },
    { id: 'settings', label: '个性化配置', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        background: 'var(--sidebar-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isMobile ? '0 20px 20px 0' : '16px',
        border: '1px solid var(--glass-border)',
        boxSizing: 'border-box',
      }}
    >
      {/* 顶部：Logo + 移动端关闭按钮 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingLeft: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'var(--accent-gradient)',
              width: '38px', height: '38px',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              flexShrink: 0
            }}>
              <PenSquare size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '0.3px', color: 'var(--text-primary)' }}>赢日志</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Winner Daily</div>
            </div>
          </div>

          {/* 移动端关闭按钮 */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 导航菜单 */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="clickable"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '14px',
                  boxShadow: isActive ? '0 4px 12px rgba(79,70,229,0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={17} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部：状态 + 主题 + 用户 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
        {/* 连接状态 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', padding: '8px 12px', borderRadius: '8px',
          background: isOffline ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          color: isOffline ? '#EF4444' : '#10B981'
        }}>
          {isOffline ? <CloudOff size={13} /> : <Database size={13} />}
          <span>{isOffline ? 'LocalStorage 离线模式' : '本地 DB 服务已连接'}</span>
        </div>

        {/* 主题切换 */}
        <div
          onClick={toggleTheme}
          className="clickable"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '10px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.04)',
            fontSize: '13px', color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === 'light' ? '明亮模式' : '暗黑模式'}</span>
          </div>
          {/* 开关动画 */}
          <div style={{
            width: '30px', height: '17px', borderRadius: '9px',
            background: theme === 'light' ? '#d1d5db' : 'var(--accent-color)',
            position: 'relative', padding: '2px', flexShrink: 0,
            transition: 'background 0.25s'
          }}>
            <div style={{
              width: '13px', height: '13px', borderRadius: '50%',
              background: '#fff', position: 'absolute', top: '2px',
              left: theme === 'light' ? '2px' : '15px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }} />
          </div>
        </div>

        {/* 用户信息 + 退出 */}
        {username && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            fontSize: '12px', color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ fontSize: '14px' }}>👤</span>
              <span style={{
                fontWeight: '600', color: 'var(--text-primary)',
                textOverflow: 'ellipsis', overflow: 'hidden',
                whiteSpace: 'nowrap', maxWidth: '110px'
              }}>
                {username}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#EF4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              退出
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
