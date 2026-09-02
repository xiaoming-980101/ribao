import React, { useState } from 'react';
import { KeyRound, User, Sparkles, RefreshCw, PenSquare } from 'lucide-react';
import { setAuthToken } from '../utils/storage';

interface LoginModalProps {
  onLoginSuccess: (username: string, settings: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginModal({ onLoginSuccess, showToast }: LoginModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('请输入完整的用户名和密码！', 'error');
      return;
    }

    if (authMode === 'register' && password !== confirmPassword) {
      showToast('两次输入的密码不一致，请核对！', 'error');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'login') {
        const res = await fetch(`/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (data.token) {
            setAuthToken(data.token);
          }
          localStorage.setItem('winner_daily_user', data.username);
          showToast(`欢迎回来，${data.username}！正在载入您的个人工作台...`, 'success');
          onLoginSuccess(data.username, data.settings);
        } else {
          showToast(data.error || '登录失败，请检查用户名或密码！', 'error');
        }
      } else {
        const res = await fetch(`/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('账号注册成功！已为您初始化好配置，请登录！', 'success');
          setAuthMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          showToast(data.error || '注册失败，请换个用户名重试！', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('网络连接出错，请确认本地后端服务已正常启动！', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* 悬浮液态玻璃模态框 */}
      <div 
        className="liquid-glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '24px',
          padding: '36px 32px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* 系统头部 Logo 与名称 */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--accent-gradient)',
              boxShadow: '0 8px 24px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PenSquare size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', marginTop: '6px' }}>
            DevTask Pro · 研发事项工作台
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {authMode === 'login' ? '研发事项记录与工时归档工作台' : '创建全新的多租户独立空间'}
          </p>
        </div>

        {/* 模式分段胶囊切换器 (Segmented Capsule) */}
        <div className="segmented-capsule-group">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`segmented-capsule-item ${authMode === 'login' ? 'active' : ''}`}
          >
            登录账号
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`segmented-capsule-item ${authMode === 'register' ? 'active' : ''}`}
          >
            注册新账号
          </button>
        </div>

        {/* 登录/注册表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>用户名</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                autoFocus
                style={{ paddingLeft: '40px' }}
              />
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>密码</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                style={{ paddingLeft: '40px' }}
              />
              <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
            </div>
          </div>

          {authMode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>确认密码</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  style={{ paddingLeft: '40px' }}
                />
                <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="clickable"
            style={{
              marginTop: '8px',
              padding: '13px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.4)',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{loading ? '正在处理...' : authMode === 'login' ? '立即进入工作台' : '完成注册'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
