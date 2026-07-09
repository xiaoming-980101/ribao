import React from 'react';
import { RouteInfo } from '../../types/ai';
import { ModelOption } from '../../utils/storage';

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
    <div style={{ position: 'relative', marginTop: '4px' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '10px 12px', 
          borderRadius: '10px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          border: '1px solid var(--glass-border)',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>AI 模式:</span>
          <span 
            style={{ 
              fontWeight: '600',
              color: aiSettings.aiEnabled ? '#10B981' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {aiSettings.aiEnabled ? (
              aiSettings.aiModel
                ? <>{aiSettings.aiModel === 'openrouter/free' ? '🟢 [备用路由]' : '🟢 🔥'} {formatSelectedModel(aiSettings.aiModel)}</>
                : '🟡 未选择模型'
            ) : '🔴 未启用大模型 (降级本地引擎)'}
          </span>
          {aiSettings.aiEnabled && lastRouteInfo && formatRouteLabel(lastRouteInfo) && (
            <span
              title={formatRouteTitle(lastRouteInfo)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: lastRouteInfo.status === 'error' ? '#F59E0B' : '#60A5FA',
                padding: '2px 6px',
                borderRadius: '4px',
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
              padding: '4px 10px', borderRadius: '6px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              cursor: 'pointer',
              fontSize: '11px', color: '#EF4444', fontWeight: '600'
            }}
            onClick={() => onNavigateToTab && onNavigateToTab('settings')}
            title="点击前往配置 API Key"
          >
            ⚠️ 未配置 API Key，点此设置
          </div>
        ) : aiSettings.aiEnabled && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => {
                setCompareMode((prev) => !prev);
                setCompareResults([]);
                setCompareModels((prev) => prev.length > 0 ? prev : buildDefaultCompareModels(aiSettings.aiModel, modelList, aiSettings.aiApiUrl));
              }}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                background: compareMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: compareMode ? '#34D399' : 'var(--text-secondary)',
                border: '1px solid ' + (compareMode ? 'rgba(16, 185, 129, 0.4)' : 'transparent'),
                fontSize: '10px',
                cursor: 'pointer'
              }}
              title="一次选择最多 3 个模型，同时生成候选后手动采用"
            >
              对比{compareMode ? ` ${compareModels.length}/3` : ''}
            </button>
            {isOpenRouterApi && (
              <button
                onClick={() => compareMode ? toggleCompareModel('openrouter/free') : handleQuickChangeModel('openrouter/free')}
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: (compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  color: (compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? '#60A5FA' : 'var(--text-secondary)',
                  border: '1px solid ' + ((compareMode ? compareModels.includes('openrouter/free') : aiSettings.aiModel === 'openrouter/free') ? 'rgba(59, 130, 246, 0.4)' : 'transparent'),
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
                title="备用自动路由：由 OpenRouter 自动分配当前可用免费模型"
              >
                备用路由
              </button>
            )}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                background: isDropdownOpen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: isDropdownOpen ? '#34D399' : 'var(--text-secondary)',
                border: '1px solid ' + (isDropdownOpen ? 'rgba(16, 185, 129, 0.4)' : 'transparent'),
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              🔍 更多模型
            </button>
          </div>
        )}
      </div>

      {compareMode && aiSettings.aiEnabled && (
        <div
          style={{
            marginTop: '6px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '10px',
            color: 'var(--text-secondary)'
          }}
        >
          <span>对比模型:</span>
          {compareModels.map((modelId) => (
            <button
              key={modelId}
              onClick={() => toggleCompareModel(modelId)}
              title="点击移除"
              style={{
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(96, 165, 250, 0.25)',
                background: 'rgba(96, 165, 250, 0.1)',
                color: '#93C5FD',
                fontSize: '10px',
                cursor: compareModels.length > 1 ? 'pointer' : 'default',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {formatSelectedModel(modelId)}
            </button>
          ))}
          <span style={{ color: 'var(--text-muted)' }}>最多 3 个</span>
        </div>
      )}

      {/* 模型检索卡片 */}
      {isDropdownOpen && aiSettings.aiEnabled && (
        <div 
          style={{
            position: 'absolute',
            bottom: '100%',
            right: '10px',
            marginBottom: '6px',
            width: '280px',
            borderRadius: '10px',
            background: 'rgba(21, 28, 44, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            padding: '8px',
            zIndex: 999
          }}
        >
          <input 
            type="text"
            placeholder="搜索已同步的所有模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--glass-border)',
              color: '#ffffff',
              fontSize: '11px',
              outline: 'none',
              marginBottom: '4px'
            }}
          />
          <div 
            style={{
              maxHeight: '160px',
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
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                        fontSize: '11px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? '700' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                        {isAuto ? '[备用] ' : (isRec ? '🔥 ' : '')}{m.name}
                      </span>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {compareMode && isSelected && (
                          <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: 'rgba(96, 165, 250, 0.18)', color: '#60A5FA', fontWeight: '700' }}>
                            已选
                          </span>
                        )}
                        {isAuto && (
                          <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', fontWeight: '700' }}>
                            首选
                          </span>
                        )}
                        {isRec && !isAuto && (
                          <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: '700' }}>
                            推荐
                          </span>
                        )}
                        <span style={{ fontSize: '8px', padding: '0px 3px', borderRadius: '2px', background: m.isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: m.isFree ? '#10B981' : '#EF4444', fontWeight: '700' }}>
                          {m.isFree ? '免费' : '付费'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '10px' }}>
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
