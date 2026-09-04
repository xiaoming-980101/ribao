import React from 'react';
import { Copy, Check, Save, Layers, RefreshCw } from 'lucide-react';
import { RouteInfo, CompareResult } from '../../types/ai';
import { CompareResults } from './CompareResults';

interface PreviewPanelProps {
  selectedDate: string;
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
  /** 查重防抖窗口内为 true，用于避免展示上一次输入的陈旧数值 */
  isCheckingSimilarity?: boolean;
  simLevel: {
    level: 'safe' | 'warning' | 'danger';
    color: string;
    text: string;
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
  selectedDate,
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
  isCheckingSimilarity = false,
  simLevel,
  aiSettings,
  compareMode,
  compareResults,
  applyCompareResult,
  handleCopyPromptAndOpenDoubao,
  handleGenerate,
  formatRouteLabel,
  formatRouteTitle
}) => {
  return (
    <div
      className="liquid-glass-card two-col-right"
      style={{
        padding: '26px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      {/* 飞星流光光学加载遮罩 */}
      {generating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(6, 9, 19, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          zIndex: 20
        }}>
          <span
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid rgba(129, 138, 248, 0.25)',
              borderTop: '3px solid #818cf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '75%', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#F8FAFC', fontWeight: '700', letterSpacing: '0.2px' }}>
              {compareMode ? '正在多引擎方案比对中...' : '正在智能格式化事项清单...'}
            </span>
            <div style={{
              width: '100%',
              height: '5px',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.08) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
            }} />
          </div>
        </div>
      )}

      {/* 表单标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px var(--accent-glow)'
          }}>
            <Layers size={16} color="#fff" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '800' }}>事项归档字段结构与详情</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyAllFieldsText}
            className="clickable"
            style={{
              padding: '7px 14px',
              borderRadius: '10px',
              background: 'var(--glass-surface-subtle)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copiedField === 'all' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copiedField === 'all' ? '已复制全部' : '一键复制全字段'}</span>
          </button>
        </div>
      </div>

      {/* 豆包提示词横幅 */}
      {mode === 'ai_prompt' && content.trim() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            padding: '14px 18px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
            border: '1px solid rgba(147, 197, 253, 0.35)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px', flex: 1 }}>
            <span style={{ fontSize: '14px', color: '#F8FAFC', fontWeight: 800 }}>
              Markdown 事项模板已就绪
            </span>
            <span style={{ fontSize: '12px', color: '#BFDBFE', lineHeight: 1.5 }}>
              点击复制格式化事项模板，可用于跨系统报告或文档备份。
            </span>
          </div>
          <button
            onClick={() => handleCopyPromptAndOpenDoubao('ai_prompt_cta')}
            className="clickable"
            style={{
              minWidth: '210px',
              padding: '11px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
            }}
          >
            {copiedField === 'ai_prompt_cta' ? <Check size={16} color="#ffffff" /> : <Copy size={16} />}
            <span>{copiedField === 'ai_prompt_cta' ? '已复制事项模板' : '复制事项模板'}</span>
          </button>
        </div>
      )}

      {/* 多模型对比候选面板 */}
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

      {/* 表单字段映射区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        {/* 1. 日志名称 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{ width: '85px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>事项名称:</label>
          <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              maxLength={30}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="智能提炼，最长30字"
              style={{ flex: 1 }}
            />
            <button
              onClick={() => copyToClipboard(title, 'title')}
              className="clickable"
              style={{
                padding: '11px 12px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="单独复制事项名称"
            >
              {copiedField === 'title' ? <Check size={15} color="#10B981" /> : <Copy size={15} />}
            </button>
          </div>
        </div>

        {/* 2. 工时 & 日期 */}
        <div className="form-row-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
            <label style={{ width: '85px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>工时(h):</label>
            <input
              type="number"
              min={1}
              max={24}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
            <label style={{ width: '85px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right' }}>归属日期:</label>
            <input
              type="text"
              value={selectedDate}
              disabled
              style={{ flex: 1, background: 'var(--glass-surface-subtle)', cursor: 'not-allowed', color: 'var(--text-secondary)' }}
            />
          </div>
        </div>

        {/* 3. 部门协作 & 工作难点 */}
        <div className="checkbox-row" style={{ paddingLeft: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="cooperation"
              checked={cooperation}
              onChange={(e) => setCooperation(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
            />
            <label htmlFor="cooperation" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>部门协作 (是/否)</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="difficulty"
              checked={difficulty}
              onChange={(e) => setDifficulty(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', borderRadius: '4px' }}
            />
            <label htmlFor="difficulty" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>工作难点 (是/否)</label>
          </div>
        </div>

        {/* 4. 日志内容 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
          <label style={{ width: '85px', fontSize: '13px', fontWeight: '700', color: 'var(--accent-color)', textAlign: 'right', marginTop: '10px' }}>工作事项内容:</label>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: '220px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
              <textarea
                maxLength={3000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请填写具体工作事项与交付内容，最长3000字"
                style={{
                  flex: 1,
                  resize: 'none',
                  lineHeight: '1.7',
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
                  padding: '9px 10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer'
                }}
                title="单独复制事项内容"
              >
                {copiedField === 'content' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部：查重状态胶囊 + 操作按钮 */}
      <div
        style={{
          borderTop: '1px solid var(--glass-border-subtle)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* 相似度状态指示胶囊 */}
        {content ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            borderRadius: '12px',
            background: 'var(--glass-surface-subtle)',
            border: '1px solid var(--glass-border-subtle)'
          }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: simLevel.color,
                boxShadow: `0 0 10px ${simLevel.color}`
              }}
            />
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>历史规范一致性指数: </span>
              {isCheckingSimilarity ? (
                <span style={{ fontWeight: '800', color: 'var(--text-muted)' }}>比对中...</span>
              ) : (
                <>
                  <span style={{ fontWeight: '800', color: simLevel.color }}>{maxSimilarity}%</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({simLevel.text})</span>
                </>
              )}
              {!isCheckingSimilarity && maxSimilarity > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  参考基准日期: {similarDate}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>暂无事项记录，请在左侧配置并点击整理。</div>
        )}

        {/* 控制按钮组 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {content && (
            <button
              onClick={handleTweak}
              disabled={saveStatus === 'saving'}
              className="clickable"
              style={{
                padding: '11px 18px',
                borderRadius: '12px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                opacity: saveStatus === 'saving' ? 0.75 : 1
              }}
              title={aiSettings.aiEnabled && aiSettings.aiApiKey ? '使用当前大模型微调内容，降低重复率' : '本地重新洗牌内容，降低重复率'}
            >
              <RefreshCw size={15} style={saveStatus === 'saving' ? { animation: 'spin 1.2s linear infinite' } : undefined} />
              <span>{saveStatus === 'saving' ? '正在微调...' : '格式优化'}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="clickable btn-shimmer-effect"
            disabled={saveStatus === 'saving'}
            style={{
              padding: '11px 22px',
              borderRadius: '12px',
              background: saveStatus === 'success' ? '#10B981' : 'var(--accent-gradient)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.4)'
            }}
          >
            {saveStatus === 'saving' ? (
              <RefreshCw size={15} style={{ animation: 'spin 1.2s linear infinite' }} />
            ) : saveStatus === 'success' ? (
              <Check size={15} />
            ) : (
              <Save size={15} />
            )}
            <span>
              {saveStatus === 'saving'
                ? '正在保存...'
                : saveStatus === 'success'
                ? '已成功归档'
                : saveStatus === 'error'
                ? '保存失败'
                : '确认归档入库'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
