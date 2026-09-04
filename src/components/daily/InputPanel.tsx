import React from 'react';
import {
  Sparkles,
  Rocket,
  Coffee,
  BookOpen,
  Bot,
  Key,
  Search,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  Compass,
  Layers
} from 'lucide-react';
import { getJobDisplayName } from '../../utils/generator';
import { DirectionOption } from '../../types/ai';

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

  // 方向罗盘相关 Props
  directions?: DirectionOption[];
  selectedDirectionId?: string | null;
  selectDirection?: (id: string) => void;
  isFetchingDirections?: boolean;
  fetchDirections?: (forceOnline?: boolean, targetPlatform?: string) => void;
  customDirectionNote?: string;
  setCustomDirectionNote?: (note: string) => void;
}

export function InputPanel({
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
  onNavigateToTab,
  directions = [],
  selectedDirectionId = null,
  selectDirection,
  isFetchingDirections = false,
  fetchDirections,
  customDirectionNote = '',
  setCustomDirectionNote
}: InputPanelProps) {
  const isNoTaskMode = mode === 'idle' || mode === 'study';

  return (
    <div
      className="liquid-glass-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {/* 0. 未配置 API 密钥时的引导条 */}
      {(!aiSettings.aiEnabled || !aiSettings.aiApiKey) && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '14px 16px',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '12px',
            color: '#F59E0B',
            lineHeight: '1.5',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
            <Lightbulb size={16} color="#F59E0B" />
            <span>智能排版与分析引擎配置指引</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '12px' }}>
            检测到您尚未配置引擎服务凭据。若要开启在线智能格式化事项归档，请参考以下指引：
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '2px' }}>
            <a 
              href="https://openrouter.ai/workspaces/default/keys" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Key size={13} /> 第一步：获取 OpenRouter API 密钥 (Keys)
            </a>
            <a 
              href="https://openrouter.ai/models?max_price=0&output_modalities=text" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#34D399', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Search size={13} /> 第二步：查阅支持的免费大模型列表
            </a>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('settings')}
              className="clickable"
              style={{
                alignSelf: 'flex-start',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#F59E0B',
                fontWeight: '600',
                fontSize: '11px',
                cursor: 'pointer',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowRight size={12} /> 前往【工作台首选项】配置引擎服务凭据
            </button>
          )}
        </div>
      )}

      {/* 1. 日期选择 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>日志归属日期</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => setQuickDate(0)}
            className="clickable"
            style={{
              padding: '0 14px',
              background: 'var(--glass-surface-subtle)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            今天
          </button>
          <button
            onClick={() => setQuickDate(1)}
            className="clickable"
            style={{
              padding: '0 14px',
              background: 'var(--glass-surface-subtle)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            昨天
          </button>
          <button
            onClick={() => setQuickDate(2)}
            className="clickable"
            style={{
              padding: '0 14px',
              background: 'var(--glass-surface-subtle)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            前天
          </button>
        </div>
      </div>

      {/* 1.5 岗位与语气风格 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>预设工作岗位</label>
          <select 
            value={job} 
            onChange={(e) => handleJobChange(e.target.value)}
          >
            <option value="backend">后端开发工程师</option>
            <option value="frontend">前端开发工程师</option>
            <option value="fullstack">全栈开发工程师</option>
            <option value="tester">测试工程师</option>
            <option value="designer">UI/UX 视觉设计师</option>
            <option value="pm">产品经理</option>
            <option value="devops">运维与SRE工程师</option>
            <option value="custom">自定义岗位</option>
          </select>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>事项排版详略模式</label>
          <select 
            value={tone} 
            onChange={(e) => handleToneChange(e.target.value)}
          >
            <option value="professional">专业严谨 (量化闭环)</option>
            <option value="daily">日常写实 (工作流记录)</option>
          </select>
        </div>
      </div>

      {job === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>自定义岗位名称</label>
          <input
            type="text"
            value={customJobName}
            onChange={(e) => setCustomJobName(e.target.value)}
            onBlur={handleCustomJobNameBlur}
            placeholder="例如：后端架构师、数据分析师、运营专家"
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            当前生效岗位：{getJobDisplayName(job, customJobName)}
          </span>
        </div>
      )}

      {/* 2. 工作状态分段胶囊控制条 (Segmented Capsule) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>工作状态模式</label>
        <div className="segmented-capsule-group">
          <button
            onClick={() => setMode('task')}
            className={`segmented-capsule-item ${mode === 'task' ? 'active' : ''}`}
          >
            <Rocket size={14} />
            <span>迭代任务</span>
          </button>
          <button
            onClick={() => setMode('idle')}
            className={`segmented-capsule-item ${mode === 'idle' ? 'active' : ''}`}
          >
            <Coffee size={14} />
            <span>系统维护</span>
          </button>
          <button
            onClick={() => setMode('study')}
            className={`segmented-capsule-item ${mode === 'study' ? 'active' : ''}`}
          >
            <BookOpen size={14} />
            <span>架构预研</span>
          </button>
          <button
            onClick={() => setMode('ai_prompt')}
            className={`segmented-capsule-item ${mode === 'ai_prompt' ? 'active' : ''}`}
          >
            <Bot size={14} />
            <span>事项模板</span>
          </button>
        </div>
      </div>

      {/* 3. 核心内容区域：按模式区分 */}
      {mode === 'task' || mode === 'ai_prompt' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            {mode === 'ai_prompt' ? '输入事项要点草稿 (用于生成格式化 Markdown 规范模板)' : '输入今日核心事项要点 (用逗号或换行分隔)'}
          </label>
          <textarea
            placeholder={mode === 'ai_prompt' ? "例如：完成用户鉴权中间件编写，排查慢查询日志并补齐索引" : "例如：支付中台、CRM系统；或具体事项：排查慢 SQL 接口耗时，联调权限拦截中间件"}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
              flex: 1,
              resize: 'none',
              minHeight: '130px',
              lineHeight: '1.7'
            }}
          />
        </div>
      ) : (
        /* ── 无任务 / 技术预研模式：今日工作方向灵感罗盘 ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {/* 1. 核心重点：输入所属平台/系统名称，激发专属 5 选 1 建议 */}
          {setCustomDirectionNote && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="var(--accent-color)" />
                  <span>负责系统 / 平台名称</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                  输入后按回车即刻发散专属事项
                </span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={customDirectionNote}
                  onChange={(e) => setCustomDirectionNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fetchDirections) {
                      e.preventDefault();
                      fetchDirections(true, customDirectionNote);
                    }
                  }}
                  placeholder="例如：支付中台、CRM会员后台、移动端小程序、数据监控大盘"
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    padding: '9px 12px',
                    borderRadius: '10px'
                  }}
                />
                {fetchDirections && (
                  <button
                    onClick={() => fetchDirections(true, customDirectionNote)}
                    disabled={isFetchingDirections}
                    className="clickable"
                    title="围绕当前平台名称重新发散 5 个切入点"
                    style={{
                      padding: '0 14px',
                      borderRadius: '10px',
                      background: 'var(--glass-surface-subtle)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isFetchingDirections ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Sparkles size={13} color="var(--accent-color)" className={isFetchingDirections ? 'animate-spin' : ''} />
                    <span>{isFetchingDirections ? '发散中...' : '智能发散'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={15} color="var(--accent-color)" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {customDirectionNote.trim() ? `【${customDirectionNote.trim()}】专属事项推荐 (5选1)` : '日常维护事项推荐库 (5选1)'}
              </span>
            </div>
            {fetchDirections && (
              <button
                onClick={() => fetchDirections(true, customDirectionNote)}
                disabled={isFetchingDirections}
                className="clickable"
                style={{
                  padding: '4px 9px',
                  borderRadius: '8px',
                  background: 'var(--glass-surface-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: isFetchingDirections ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={11} className={isFetchingDirections ? 'animate-spin' : ''} />
                <span>换一批</span>
              </button>
            )}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {customDirectionNote.trim()
              ? `已结合【${customDirectionNote.trim()}】与 ${getJobDisplayName(job, customJobName)} 岗位特征自动衍生，请勾选最契合的切入点：`
              : `系统已结合 ${getJobDisplayName(job, customJobName)} 岗位特征排查，请在下方直接勾选今天推进的切入点：`}
          </div>

          {/* 5 个 Bento 风格悬浮液态玻璃方向卡片 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {directions.map((dir, idx) => {
              const isSelected = selectedDirectionId === dir.id;
              return (
                <div
                  key={dir.id || idx}
                  onClick={() => selectDirection && selectDirection(dir.id)}
                  className={`clickable stagger-item-${(idx % 5) + 1} ${isSelected ? 'pulse-glow-badge' : ''}`}
                  style={{
                    padding: '11px 13px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--glass-surface-subtle)',
                    border: isSelected ? '1.5px solid var(--accent-color)' : '1px solid var(--glass-border)',
                    boxShadow: isSelected ? '0 0 16px var(--accent-glow)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          background: isSelected ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                        }}
                      >
                        {dir.tag || (mode === 'study' ? '技术预研' : '日常维护')}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                        {idx + 1}. {dir.title}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 size={16} color="var(--accent-color)" />}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', paddingLeft: '2px' }}>
                    {dir.summary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. 一键生成流光操作按钮 */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="clickable glow-btn btn-shimmer-effect"
        style={{
          padding: '13px 20px',
          borderRadius: '14px',
          background: 'var(--accent-gradient)',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px var(--accent-glow)',
          cursor: generating ? 'not-allowed' : 'pointer',
          opacity: generating ? 0.7 : 1,
          marginTop: '6px'
        }}
      >
        <Sparkles size={16} className={generating ? 'animate-spin' : ''} />
        <span>
          {generating
            ? '正在智能整理与校验事项清单...'
            : isNoTaskMode
            ? '基于选定事项整理并格式化归档'
            : '一键整理并格式化归档'}
        </span>
      </button>
    </div>
  );
}

export default InputPanel;
