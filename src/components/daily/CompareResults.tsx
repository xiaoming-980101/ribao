import React from 'react';
import { CompareResult } from '../../types/ai';

interface CompareResultsProps {
  compareResults: CompareResult[];
  handleGenerate: () => void;
  saveStatus: string;
  applyCompareResult: (result: CompareResult) => void;
  formatRouteLabel: (info: any) => string;
  formatRouteTitle: (info: any) => string;
}

export const CompareResults: React.FC<CompareResultsProps> = ({
  compareResults,
  handleGenerate,
  saveStatus,
  applyCompareResult,
  formatRouteLabel,
  formatRouteTitle
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px',
        borderRadius: '8px',
        background: 'rgba(96, 165, 250, 0.06)',
        border: '1px solid rgba(96, 165, 250, 0.18)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#BFDBFE' }}>多模型候选</div>
        <button
          onClick={handleGenerate}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer'
          }}
        >
          重新对比
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {compareResults.map((result) => {
          const routeLabel = formatRouteLabel(result.routeInfo) || result.requestedModel;
          const isSuccess = !!result.content;
          return (
            <div
              key={result.id}
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: isSuccess ? 'rgba(15, 23, 42, 0.55)' : 'rgba(127, 29, 29, 0.16)',
                border: '1px solid ' + (isSuccess ? 'rgba(96, 165, 250, 0.2)' : 'rgba(248, 113, 113, 0.25)'),
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minHeight: '170px'
              }}
            >
              <div title={formatRouteTitle(result.routeInfo)} style={{ fontSize: '11px', color: isSuccess ? '#93C5FD' : '#FCA5A5', fontWeight: 700, wordBreak: 'break-all' }}>
                {routeLabel}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4, wordBreak: 'break-all' }}>
                请求: {result.routeInfo?.requestedModel || result.requestedModel}
                {result.routeInfo?.providerName ? ` · Provider: ${result.routeInfo.providerName}` : ''}
              </div>
              {isSuccess ? (
                <>
                  <div style={{ fontSize: '12px', color: '#FDE68A', fontWeight: 700 }}>{result.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxHeight: '118px', overflow: 'auto' }}>
                    {result.content}
                  </div>
                  <button
                    onClick={() => applyCompareResult(result)}
                    style={{
                      marginTop: 'auto',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'rgba(59, 130, 246, 0.22)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#BFDBFE',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    采用这版
                  </button>
                </>
              ) : (
                <div style={{ fontSize: '11px', color: '#FCA5A5', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {result.error || '模型请求失败'}
                  {result.routeInfo?.retryAfterSeconds ? `（${result.routeInfo.retryAfterSeconds}s 后可重试）` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
