import React from 'react';
import { User, PenSquare, Calendar, FileText, Settings, Sun, Moon, Database, CloudOff, X, LogOut } from 'lucide-react';

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
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'generator', label: '工作事项整理', icon: PenSquare },
    { id: 'calendar', label: '工时事项日历', icon: Calendar },
    { id: 'weekly', label: '周期事项归档', icon: FileText },
    { id: 'settings', label: '工作台首选项', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      className="liquid-glass-card"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px 16px',
        borderRadius: isMobile ? '0 24px 24px 0' : '22px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* 顶部：Logo + 移动端关闭按钮 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', paddingLeft: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="pulse-glow-badge"
              style={{
                background: 'var(--accent-gradient)',
                width: '42px', height: '42px',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.4)',
                flexShrink: 0
              }}
            >
              <PenSquare size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>DevTask</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Workstation Pro</div>
            </div>
          </div>

          {/* 移动端关闭按钮 */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="clickable"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '34px', height: '34px',
                borderRadius: '10px',
                background: 'var(--glass-surface-subtle)',
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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: isActive ? 'var(--accent-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '14px',
                  boxShadow: isActive ? '0 8px 24px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.3)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                  position: 'relative',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Icon size={18} color={isActive ? '#ffffff' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* 底部：连接状态 + 主题切换 + 用户信息 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        {/* 连接状态指示 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', fontWeight: '600', padding: '9px 14px', borderRadius: '12px',
          background: isOffline ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
          border: '1px solid ' + (isOffline ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'),
          color: isOffline ? '#EF4444' : '#10B981'
        }}>
          {isOffline ? <CloudOff size={14} /> : <Database size={14} />}
          <span>{isOffline ? '本地存储模式 (Local Storage)' : '数据服务运行正常 (Online)'}</span>
        </div>

        {/* 主题切换 */}
        <div
          onClick={toggleTheme}
          className="clickable"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '12px',
            border: '1px solid var(--glass-border-subtle)',
            background: 'var(--glass-surface-subtle)',
            fontSize: '13px', color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {theme === 'light' ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} color="#818CF8" />}
            <span style={{ fontWeight: '500' }}>{theme === 'light' ? '明亮模式' : '暗黑模式'}</span>
          </div>
          {/* 开关胶囊动画 */}
          <div style={{
            width: '36px', height: '20px', borderRadius: '10px',
            background: theme === 'light' ? 'rgba(0,0,0,0.12)' : 'var(--accent-color)',
            position: 'relative', padding: '2px', flexShrink: 0,
            transition: 'background 0.25s'
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#fff', position: 'absolute', top: '2px',
              left: theme === 'light' ? '2px' : '18px',
              transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.25)'
            }} />
          </div>
        </div>

        {/* 用户信息与退出登录 */}
        {username && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: '12px',
            background: 'var(--glass-surface-subtle)',
            border: '1px solid var(--glass-border-subtle)',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '11px', fontWeight: '700'
              }}>
                <User size={13} />
              </div>
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
              className="clickable"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '6px'
              }}
              title="退出当前账号"
            >
              <LogOut size={13} />
              <span>退出</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
