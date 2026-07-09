import React from 'react';
import { Copy, Check, Save, Layers, RefreshCw } from 'lucide-react';
import { RouteInfo, CompareResult } from '../../types/ai';
import { CompareResults } from './CompareResults';

interface PreviewPanelProps {
  title: string;
  setTitle: (title: string) => void;
  hours: number;
  setHours: (hours: number) => void;
  cooperation: boolean;
  setCooperation: (cooperation: boolean) => void;
  difficulty: boolean;
  setDifficulty: (difficulty: boolean) => void;
  content: string;
  setContent: (content: string) => void;
  copiedField: string | null;
  copyToClipboard: (text: string, field: string) => void;
  copyAllFieldsText: () => void;
  
  mode: 'task' | 'idle' | 'study' | 'ai_prompt';
  generating: boolean;
  handleTweak: () => void;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  handleSave: () => void;
  
  maxSimilarity: number;
  similarDate: string;
  simLevel: {
    level: 'low' | 'medium' | 'high';
    color: string;
    text: string;
    description: string;
  };
  
  aiSettings: {
    aiEnabled: boolean;
    aiApiKey: string;
    aiApiUrl: string;
    aiModel: string;
  };
  
  compareMode: boolean;
  compareResults: CompareResult[];
  applyCompareResult: (result: CompareResult) => void;
  lastRouteInfo: RouteInfo | null;
  handleCopyPromptAndOpenDoubao: (field: string) => void;
  handleGenerate: () => void;
  
  formatRouteLabel: (info: any) => string;
  formatRouteTitle: (info: any) => string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  setTitle,
  hours,
  setHours,
  cooperation,
  setCooperation,
  difficulty,
  setDifficulty,
  content,
  setContent,
  copiedField,
  copyToClipboard,
  copyAllFieldsText,
  mode,
  generating,
  handleTweak,
  saveStatus,
  handleSave,
  maxSimilarity,
  similarDate,
  simLevel,
  aiSettings,
  compareMode,
  compareResults,
  applyCompareResult,
  lastRouteInfo,
  handleCopyPromptAndOpenDoubao,
  handleGenerate,
  formatRouteLabel,
  formatRouteTitle
}) => {
  return (
    <div
      className="glass-panel two-col-right"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      {/* 飞星流光加载遮罩层 */}
      {generating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 10
        }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid rgba(129, 138, 248, 0.3)',
              borderTop: '3px solid #818cf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '80%', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {compareMode ? '🧪 多个模型正在生成候选，请稍候...' : '🤖 大模型正在撰写写实日报，请稍候...'}
            </span>
            <div style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }} />
          </div>
        </div>
      )}

      {/* 表单标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-color)" />
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>适配系统表单预览</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyAllFieldsText}
            className="clickable"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copiedField === 'all' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copiedField === 'all' ? '已复制全部' : '复制全部字段'}</span>
          </button>
        </div>
      </div>

      {/* 豆包提示词 */}
      {mode === 'ai_prompt' && content.trim() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.18) 0%, rgba(37, 99, 235, 0.18) 100%)',
            border: '1px solid rgba(147, 197, 253, 0.34)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '220px', flex: 1 }}>
            <span style={{ fontSize: '13px', color: '#F8FAFC', fontWeight: 800 }}>
              Prompt 已准备好
            </span>
            <span style={{ fontSize: '11px', color: '#BFDBFE', lineHeight: 1.5 }}>
              点击右侧按钮复制并打开豆包，进入新对话后直接粘贴发送。
            </span>
          </div>
          <button
            onClick={() => handleCopyPromptAndOpenDoubao('ai_prompt_cta')}
            className="clickable"
            style={{
              minWidth: '210px',
              padding: '11px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #22C55E 0%, #2563EB 100%)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 12px 26px rgba(37, 99, 235, 0.28)'
            }}
          >
            {copiedField === 'ai_prompt_cta' ? <Check size={16} color="#ffffff" /> : <Copy size={16} />}
            <span>{copiedField === 'ai_prompt_cta' ? '已复制，正在打开豆包' : '复制 Prompt 并打开豆包'}</span>
          </button>
        </div>
      )}

      {/* 多模型对比候选 */}
      {compareMode && compareResults.length > 0 && (
        <CompareResults
          compareResults={compareResults}
          handleGenerate={handleGenerate}
          saveStatus={generating ? 'saving' : 'idle'}
          applyCompareResult={applyCompareResult}
          formatRouteLabel={formatRouteLabel}
          formatRouteTitle={formatRouteTitle}
        />
      )}

      {/* 表单字段区 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* 1. 日志名称 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>日志名称:</label>
          <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              maxLength={30}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="自动生成，最长30字"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => copyToClipboard(title, 'title')}
              className="clickable"
              style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              title="单独复制日志名称"
            >
              {copiedField === 'title' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* 2. 工时 & 日期 */}
        <div className="form-row-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>工时(h):</label>
            <input
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right' }}>日志日期:</label>
            <input
              type="text"
              value={selectedDate}
              disabled
              style={{ flex: 1, background: 'rgba(0,0,0,0.1)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
            />
          </div>
        </div>

        {/* 3. 部门协作 & 工作难点 */}
        <div className="checkbox-row" style={{ paddingLeft: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="cooperation"
              checked={cooperation}
              onChange={(e) => setCooperation(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="cooperation" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>部门协作 (是/否)</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="difficulty"
              checked={difficulty}
              onChange={(e) => setDifficulty(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="difficulty" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>工作难点 (是/否)</label>
          </div>
        </div>

        {/* 4. 日志内容 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
          <label style={{ width: '90px', fontSize: '13px', fontWeight: '600', color: '#EAB308', textAlign: 'right', marginTop: '8px' }}>日志内容:</label>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: '220px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <textarea
                maxLength={3000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请填写日志内容，最长3000字"
                style={{
                  flex: 1,
                  resize: 'none',
                  lineHeight: '1.6',
                  minHeight: '200px'
                }}
              />
              <button
                onClick={() => copyToClipboard(content, 'content')}
                className="clickable"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer'
                }}
                title="单独复制日志内容"
              >
                {copiedField === 'content' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 查重提示与底栏控制 */}
      <div
        style={{
          borderTop: '1px solid var(--glass-border)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        {/* 相似度状态 */}
        {content ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: simLevel.color,
                boxShadow: `0 0 8px ${simLevel.color}`
              }}
            />
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>最近30天最大相似度: </span>
              <span style={{ fontWeight: '700', color: simLevel.color }}>{maxSimilarity}%</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({simLevel.text})</span>
              {maxSimilarity > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  最相似日期: {similarDate}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>暂无生成内容，请在左侧点击生成。</div>
        )}

        {/* 控制按钮组 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {content && (
            <button
              onClick={handleTweak}
              disabled={saveStatus === 'saving'}
              className="clickable"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.75 : 1
              }}
              title={aiSettings.aiEnabled && aiSettings.aiApiKey ? '使用当前大模型微调内容，降低重复率' : '本地重新洗牌内容，降低重复率'}
            >
              <RefreshCw size={14} style={saveStatus === 'saving' ? { animation: 'spin 1.2s linear infinite' } : undefined} />
              <span>{saveStatus === 'saving' ? '正在微调...' : '智能微调'}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="clickable"
            disabled={saveStatus === 'saving'}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: saveStatus === 'success' ? '#10B981' : 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.15)'
            }}
          >
            {saveStatus === 'saving' ? (
              <RefreshCw size={14} style={{ animation: 'spin 1.2s linear infinite' }} />
            ) : saveStatus === 'success' ? (
              <Check size={14} />
            ) : (
              <Save size={14} />
            )}
            <span>
              {saveStatus === 'saving'
                ? '正在保存...'
                : saveStatus === 'success'
                ? '已保存到数据库'
                : saveStatus === 'error'
                ? '保存失败'
                : '保存并记录'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
