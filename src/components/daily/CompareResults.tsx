import React from 'react';
import { CompareResult, RouteInfo } from '../../types/ai';
import { RefreshCw, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface CompareResultsProps {
  compareResults: CompareResult[];
  handleGenerate: () => void;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  applyCompareResult: (result: CompareResult) => void;
  formatRouteLabel: (info: RouteInfo | null) => string;
  formatRouteTitle: (info: RouteInfo | null) => string;
}

export const CompareResults: React.FC<CompareResultsProps> = ({
  compareResults,
  handleGenerate,
  saveStatus,
  applyCompareResult,
  formatRouteLabel: _formatRouteLabel,
  formatRouteTitle: _formatRouteTitle
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} color="var(--accent-color)" />
          <h4 style={{ fontSize: '14px', fontWeight: '800' }}>多模型候选对比 ({compareResults.length} 个模型)</h4>
        </div>
        <button
          onClick={handleGenerate}
          disabled={saveStatus === 'saving'}
          className="clickable"
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'var(--glass-surface-subtle)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={12} style={saveStatus === 'saving' ? { animation: 'spin 1s linear infinite' } : undefined} />
          <span>重新对比</span>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(compareResults.length, 3)}, 1fr)`,
        gap: '12px'
      }}>
        {compareResults.map((result, index) => {
          const isError = !!result.error;
          return (
            <div
              key={result.id || index}
              className="liquid-glass-card"
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                borderRadius: '14px',
                border: isError ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--glass-border)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {result.requestedModel.split('/').pop()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isError && result.content && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'var(--glass-surface-subtle)', padding: '1px 5px', borderRadius: '4px' }}>
                        {result.content.length} 字
                      </span>
                    )}
                    {isError ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#EF4444', fontWeight: '700' }}>
                        <AlertTriangle size={12} /> 失败
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#10B981', fontWeight: '700' }}>
                        <CheckCircle2 size={12} /> 成功
                      </span>
                    )}
                  </div>
                </div>

                {isError ? (
                  <p style={{ fontSize: '11px', color: '#EF4444', lineHeight: 1.5 }}>
                    {result.error}
                  </p>
                ) : (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-color)', marginBottom: '4px' }}>
                      {result.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-line'
                    }}>
                      {result.content}
                    </div>
                  </>
                )}
              </div>

              {!isError && (
                <button
                  onClick={() => applyCompareResult(result)}
                  className="clickable"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--accent-gradient)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px var(--accent-glow)'
                  }}
                >
                  采纳此模型生成
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
