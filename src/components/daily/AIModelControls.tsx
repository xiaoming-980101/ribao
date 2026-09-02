import React from 'react';
import { RouteInfo } from '../../types/ai';
import { ModelOption } from '../../utils/storage';
import { Search, AlertCircle } from 'lucide-react';

interface AIModelControlsProps {
  aiSettings: {
    aiEnabled: boolean;
    aiApiKey: string;
    aiApiUrl: string;
    aiModel: string;
  };
  lastRouteInfo: RouteInfo | null;
  compareMode: boolean;
  setCompareMode: React.Dispatch<React.SetStateAction<boolean>>;
  compareModels: string[];
  setCompareModels: React.Dispatch<React.SetStateAction<string[]>>;
  compareResults: any[];
  setCompareResults: React.Dispatch<React.SetStateAction<any[]>>;
  modelList: ModelOption[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpenRouterApi: boolean;
  handleQuickChangeModel: (model: string) => Promise<void>;
  toggleCompareModel: (model: string) => void;
  buildDefaultCompareModels: (current: string, models: ModelOption[], url: string) => string[];
  formatSelectedModel: (model: string) => string;
  formatRouteLabel: (info: RouteInfo | null) => string;
  formatRouteTitle: (info: RouteInfo | null) => string;
  checkIsRecommended: (model: ModelOption) => boolean;
  onNavigateToTab?: (tab: string) => void;
}

export const AIModelControls: React.FC<AIModelControlsProps> = ({
  aiSettings,
  lastRouteInfo,
  compareMode,
  setCompareMode,
  compareModels,
  setCompareModels,
  setCompareResults,
  modelList,
  isDropdownOpen,
  setIsDropdownOpen,
  searchQuery,
  setSearchQuery,
  isOpenRouterApi,
  handleQuickChangeModel,
  toggleCompareModel,
  buildDefaultCompareModels,
  formatSelectedModel,
  formatRouteLabel,
  formatRouteTitle,
  checkIsRecommended,
  onNavigateToTab
}) => {
  return (
    <div style={{ position: 'relative', marginTop: '6px' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '11px 16px', 
          borderRadius: '14px', 
          background: 'var(--glass-surface-subtle)', 
          border: '1px solid var(--glass-border-subtle)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>分析引擎状态:</span>
          <span 
            style={{ 
              fontWeight: '600',
              color: aiSettings.aiEnabled ? '#10B981' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {aiSettings.aiEnabled ? (
              aiSettings.aiModel ? (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                  {aiSettings.aiModel === 'openrouter/free' ? '[自动路由] ' : ''}
                  {formatSelectedModel(aiSettings.aiModel)}
                </>
              ) : (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
                  未指定引擎
                </>
              )
            ) : (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
                本地规则模式
              </>
            )}
          </span>
          {aiSettings.aiEnabled && lastRouteInfo && formatRouteLabel(lastRouteInfo) && (
            <span
              title={formatRouteTitle(lastRouteInfo)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: lastRouteInfo.status === 'error' ? '#F59E0B' : '#60A5FA',
                padding: '3px 8px',
                borderRadius: '6px',
                background: lastRouteInfo.status === 'error' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(96, 165, 250, 0.12)',
                border: '1px solid ' + (lastRouteInfo.status === 'error' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(96, 165, 250, 0.25)'),
                wordBreak: 'break-all'
              }}
            >
              实际: {formatRouteLabel(lastRouteInfo)}
              {lastRouteInfo.status === 'error' ? '（失败）' : ''}
              {lastRouteInfo.retryAfterSeconds ? ` · ${lastRouteInfo.retryAfterSeconds}s 后重试` : ''}
            </span>
          )}
        </div>
        
        {aiSettings.aiEnabled && !aiSettings.aiApiKey ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '5px 12px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              cursor: 'pointer',
              fontSize: '11px', color: '#EF4444', fontWeight: '600'
            }}
            onClick={() => onNavigateToTab && onNavigateToTab('settings')}
            title="点击前往配置 API Key"
          >
            <AlertCircle size={13} /> 未配置引擎凭据，点此设置
          </div>
        ) : aiSettings.aiEnabled && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setCompareMode((prev) => !prev);
                setCompareResults([]);
                setCompareModels((prev) => prev.length > 0 ? prev : buildDefaultCompareModels(aiSettings.aiModel, modelList, aiSettings.aiApiUrl));
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: compareMode ? 'var(--accent-gradient)' : 'var(--glass-surface-subtle)',
                color: compareMode ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (compareMode ? 'rgba(255,255,255,0.3)' : 'var(--glass-border)'),
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: compareMode ? '0 4px 12px var(--accent-glow)' : 'none'
              }}
              title="一次选择最多 3 个模型，同时生成候选后手动采用"
            >
              方案比对{compareMode ? ` (${compareModels.length}/3)` : ''}
            </button>
            {isOpenRouterApi && (
              <button
                onClick={() => compareMode ? toggleCompareModel('openrouter/free') : handleQuickChangeModel('openrouter/free')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: (compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? 'rgba(59, 130, 246, 0.25)' : 'var(--glass-surface-subtle)',
                  color: (compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? '#60A5FA' : 'var(--text-secondary)',
                  border: '1px solid ' + ((compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? 'rgba(59, 130, 246, 0.4)' : 'var(--glass-border)'),
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
                title="备用自动路由：由 OpenRouter 自动分配当前可用免费模型"
              >
                自动路由
              </button>
            )}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: isDropdownOpen ? 'var(--accent-gradient)' : 'var(--glass-surface-subtle)',
                color: isDropdownOpen ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (isDropdownOpen ? 'rgba(255,255,255,0.3)' : 'var(--glass-border)'),
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Search size={12} />
              <span>切换引擎</span>
            </button>
          </div>
        )}
      </div>

      {compareMode && aiSettings.aiEnabled && (
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ fontWeight: '600' }}>当前对比队列:</span>
          {compareModels.map((modelId) => (
            <button
              key={modelId}
              onClick={() => toggleCompareModel(modelId)}
              title="点击移除"
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                background: 'rgba(96, 165, 250, 0.12)',
                color: '#93C5FD',
                fontSize: '11px',
                fontWeight: '600',
                cursor: compareModels.length > 1 ? 'pointer' : 'default',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {formatSelectedModel(modelId)} ×
            </button>
          ))}
          <span style={{ color: 'var(--text-muted)' }}>最多 3 个</span>
        </div>
      )}

      {/* 模型检索 visionOS 悬浮抽屉卡片 */}
      {isDropdownOpen && aiSettings.aiEnabled && (
        <div 
          className="liquid-glass-card"
          style={{
            position: 'absolute',
            bottom: '100%',
            right: '0',
            marginBottom: '8px',
            width: '300px',
            padding: '12px',
            zIndex: 999
          }}
        >
          <input 
            type="text"
            placeholder="搜索已同步的全部模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '6px'
            }}
          />
          <div 
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {(() => {
              const getModelWeight = (m: ModelOption) => {
                const isRec = checkIsRecommended(m);
                if (m.isFree && isRec) return 4;
                if (m.isFree) return 3;
                if (isRec) return 2;
                return 1;
              };

              const filtered = modelList
                .filter(m => 
                  m.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (searchQuery.toLowerCase() === 'free' && m.isFree)
                )
                .sort((a, b) => getModelWeight(b) - getModelWeight(a));

              return filtered.length > 0 ? (
                filtered.map((m) => {
                  const isRec = checkIsRecommended(m);
                  const isAuto = m.id.toLowerCase().includes('openrouter/free');
                  const isSelected = compareMode ? compareModels.includes(m.id) : aiSettings.aiModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (compareMode) {
                          toggleCompareModel(m.id);
                        } else {
                          handleQuickChangeModel(m.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      className="clickable"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                        fontSize: '11px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? '700' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                        {isAuto ? '[自动] ' : ''}{m.name}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {compareMode && isSelected && (
                          <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', background: 'rgba(96, 165, 250, 0.2)', color: '#60A5FA', fontWeight: '700' }}>
                            已选
                          </span>
                        )}
                        {isRec && !isAuto && (
                          <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', fontWeight: '700' }}>
                            推荐
                          </span>
                        )}
                        <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '4px', background: m.isFree ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: m.isFree ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                          {m.isFree ? '免费' : '付费'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                  无匹配模型
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
