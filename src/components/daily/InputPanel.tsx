import React from 'react';
import { Sparkles } from 'lucide-react';
import { getJobDisplayName } from '../../utils/generator';

interface InputPanelProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setQuickDate: (offset: number) => void;
  job: string;
  handleJobChange: (job: string) => void;
  tone: string;
  handleToneChange: (tone: string) => void;
  customJobName: string;
  setCustomJobName: (name: string) => void;
  handleCustomJobNameBlur: () => void;
  mode: 'task' | 'idle' | 'study' | 'ai_prompt';
  setMode: (mode: 'task' | 'idle' | 'study' | 'ai_prompt') => void;
  userInput: string;
  setUserInput: (input: string) => void;
  aiSettings: {
    aiEnabled: boolean;
    aiApiKey: string;
    aiApiUrl: string;
    aiModel: string;
  };
  generating: boolean;
  handleGenerate: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  selectedDate,
  setSelectedDate,
  setQuickDate,
  job,
  handleJobChange,
  tone,
  handleToneChange,
  customJobName,
  setCustomJobName,
  handleCustomJobNameBlur,
  mode,
  setMode,
  userInput,
  setUserInput,
  aiSettings,
  generating,
  handleGenerate,
  onNavigateToTab
}) => {
  return (
    <div
      className="glass-panel two-col-left"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* AI 激活横幅 */}
      {!aiSettings.aiApiKey && (
        <div 
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(99, 102, 241, 0.06) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '11px',
            color: '#EAB308',
            lineHeight: '1.5'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}>
            <span>💡</span>
            <span>AI 大模型功能激活指引</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            检测到您尚未配置 API 密钥。若要开启智能生成日报功能，请优先做以下配置：
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px' }}>
            <a 
              href="https://openrouter.ai/workspaces/default/keys" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: '600' }}
            >
              🔑 第一步：直达获取 OpenRouter API 密钥 (Keys)
            </a>
            <a 
              href="https://openrouter.ai/models?max_price=0&output_modalities=text" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#34D399', textDecoration: 'underline', fontWeight: '600' }}
            >
              🔍 第二步：查阅 OpenRouter 平台的免费模型列表
            </a>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('settings')}
              className="clickable"
              style={{
                alignSelf: 'flex-start',
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#F59E0B',
                fontWeight: '600',
                fontSize: '10px',
                cursor: 'pointer',
                marginTop: '2px'
              }}
            >
              ➡️ 一键前往【个性化配置】配置 API Key
            </button>
          )}
        </div>
      )}

      {/* 1. 日期选择 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>选择日志日期</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={() => setQuickDate(0)} className="clickable" style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}>今天</button>
          <button onClick={() => setQuickDate(1)} className="clickable" style={{ padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}>昨天</button>
        </div>
      </div>

      {/* 1.5 岗位与语气风格 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>预设岗位</label>
          <select 
            value={job} 
            onChange={(e) => handleJobChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--glass-border)',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="frontend">💻 前端开发工程师</option>
            <option value="designer">🎨 UI/UX 视觉设计师</option>
            <option value="tester">🧪 测试工程师</option>
            <option value="custom">✍️ 自定义岗位</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>生成语气风格</label>
          <select 
            value={tone} 
            onChange={(e) => handleToneChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--glass-border)',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="professional">📋 专业严谨 (工作量饱和)</option>
            <option value="daily">☕ 轻松日常 (流水账极自然)</option>
          </select>
        </div>
      </div>

      {job === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>自定义岗位名称</label>
          <input
            type="text"
            value={customJobName}
            onChange={(e) => setCustomJobName(e.target.value)}
            onBlur={handleCustomJobNameBlur}
            placeholder="例如：产品经理、运营、后端开发工程师"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.15)',
              border: '1px solid var(--glass-border)',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            当前生成岗位：{getJobDisplayName(job, customJobName)}
          </span>
        </div>
      )}

      {/* 2. 工作状态/模式选择 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>选择今天的工作状态</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setMode('task')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: mode === 'task' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'task' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: mode === 'task' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            🚀 正常有任务
          </button>
          <button
            onClick={() => setMode('idle')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: mode === 'idle' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'idle' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: mode === 'idle' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            ☕ 无任务/维护
          </button>
          <button
            onClick={() => setMode('study')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: mode === 'study' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'study' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: mode === 'study' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            📖 学习与预研
          </button>
          <button
            onClick={() => setMode('ai_prompt')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: mode === 'ai_prompt' ? 'var(--accent-gradient)' : 'transparent',
              color: mode === 'ai_prompt' ? '#fff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: mode === 'ai_prompt' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            🤖 豆包提示词
          </button>
        </div>
      </div>

      {/* 3. 任务输入 */}
      {mode === 'task' || mode === 'ai_prompt' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {mode === 'ai_prompt' ? '输入你想让豆包润色的任务' : '输入今日核心任务 (用逗号或换行分隔)'}
          </label>
          <textarea
            placeholder={mode === 'ai_prompt' ? "例如：写完了用户登录页面，顺便修了修老机型兼容问题" : "例如：对接登录页面接口，修复导航栏错位bug"}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
              flex: 1,
              resize: 'none',
              minHeight: '120px',
              lineHeight: '1.6'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--glass-border)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            minHeight: '140px'
          }}
        >
          {mode === 'idle' ? (
            <p>
              🌴 <b>当前为日常维护/无任务模式。</b>
              <br />
              无需输入任务，系统将自动基于岗位库为您碰撞生成今天的工作流水账，避开敏感词。
            </p>
          ) : (
            <p>
              📖 <b>当前为技术学习与预研模式。</b>
              <br />
              系统将自动为您生成今天对新技术进行前置了解、踩坑并输出 Demo 样板的学习型日报。
            </p>
          )}
        </div>
      )}

      {/* 4. 一键生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="clickable"
        style={{
          width: '100%',
          padding: '12px',
          background: 'var(--accent-gradient)',
          border: 'none',
          borderRadius: '8px',
          color: '#ffffff',
          fontWeight: '700',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
          cursor: generating ? 'not-allowed' : 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {generating ? (
          <>
            <span
              style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            <span>正在智能润色生成中...</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>
              {aiSettings.aiEnabled && aiSettings.aiApiKey
                ? mode === 'ai_prompt' ? '一键生成豆包 Prompt' : '一键 AI 智能生成'
                : '本地引擎快速碰撞生成'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
