import React, { useState } from 'react';
import { KeyRound, User, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (username: string, settings: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginModal({ onLoginSuccess, showToast }: LoginModalProps) {
  // 'login' 登录模式, 'register' 注册模式
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
    const BACKEND_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
      ? 'http://localhost:3001'
      : window.location.origin;

    try {
      if (authMode === 'login') {
        const res = await fetch(`${BACKEND_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('winner_daily_user', data.username);
          showToast(`🎉 欢迎回来，${data.username}！正在载入您的个人工作台...`, 'success');
          onLoginSuccess(data.username, data.settings);
        } else {
          showToast(data.error || '登录失败，请检查用户名或密码！', 'error');
        }
      } else {
        // 注册
        const res = await fetch(`${BACKEND_URL}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('🎉 账号注册成功！已为您初始化好配置，请登录！', 'success');
          setAuthMode('login');
          setPassword('');
          setConfirmPassword('');
        } else {
          showToast(data.error || '注册失败，请换个用户名重试！', 'error');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('❌ 网络连接出错，请确认本地 Node.js 后端是否已正常启动！', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#0a0f1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* 背景梦幻光影特效 */}
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
          top: '10%',
          left: '20%',
          filter: 'blur(40px)',
          zIndex: 1
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 70%)',
          bottom: '10%',
          right: '20%',
          filter: 'blur(40px)',
          zIndex: 1
        }}
      />

      {/* 登录注册主磨砂卡片 */}
      <div 
        className="login-card-wrapper"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          padding: '40px 32px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          transition: 'all 0.3s ease'
        }}
      >
        {/* 系统头部 Logo 与名称 */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={24} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginTop: '6px', background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            赢日志 · Winner Daily
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {authMode === 'login' ? '智能工作日志与多岗位日报生成系统' : '创建一个全新的多租户独立存储账号'}
          </p>
        </div>

        {/* 提交表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 用户名 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>用户名</label>
            <div style={{ position: 'relative' }}>
              <User 
                size={14} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="text"
                placeholder="请输入用户名 (英文/数字)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 密码 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>密码</label>
            <div style={{ position: 'relative' }}>
              <KeyRound 
                size={14} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* 注册确认密码 */}
          {authMode === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>确认密码</label>
              <div style={{ position: 'relative' }}>
                <KeyRound 
                  size={14} 
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* 登录/注册按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="clickable"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              authMode === 'login' ? '立即登录进入' : '同意规范并注册'
            )}
          </button>
        </form>

        {/* 底部登录注册模式切换器 */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {authMode === 'login' ? (
            <>
              还没有个人隔离账号？{' '}
              <span 
                onClick={() => {
                  setAuthMode('register');
                  setUsername('');
                  setPassword('');
                }}
                style={{ color: '#818CF8', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
              >
                去注册
              </span>
            </>
          ) : (
            <>
              已有隔离备份账号？{' '}
              <span 
                onClick={() => {
                  setAuthMode('login');
                  setUsername('');
                  setPassword('');
                }}
                style={{ color: '#818CF8', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
              >
                返回登录
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
