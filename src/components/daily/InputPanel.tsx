import React from 'react';
import {
  Sparkles,
  Rocket,
  Coffee,
  BookOpen,
  FileCode,
  Key,
  Search,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  Compass,
  Calendar,
  Briefcase,
  SlidersHorizontal
} from 'lucide-react';
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
  isOfflineDirections?: boolean;
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
  isOfflineDirections = false,
  fetchDirections,
  customDirectionNote = '',
  setCustomDirectionNote
}: InputPanelProps) {
  const isNoTaskMode = mode === 'idle' || mode === 'study';

  return (
    <div
      className="liquid-glass-card glow-border-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative'
      }}
    >
      {/* 0. 未配置 API 密钥时的引导条 */}
      {(!aiSettings.aiEnabled || !aiSettings.aiApiKey) && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '12px 14px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            color: '#F59E0B',
            lineHeight: '1.4'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' }}>
            <Lightbulb size={15} color="#F59E0B" />
            <span>智能排版与分析引擎配置指引</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '12px' }}>
            检测到您尚未配置引擎服务凭据。若要开启在线智能格式化事项归档，请参考以下指引：
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a 
              href="https://openrouter.ai/workspaces/default/keys" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Key size={12} /> 获取 OpenRouter 密钥
            </a>
            <a 
              href="https://openrouter.ai/models?max_price=0&output_modalities=text" 
              target="_blank" 
              rel="noreferrer"
              style={{ color: '#34D399', textDecoration: 'underline', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Search size={12} /> 免费大模型列表
            </a>
          </div>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('settings')}
              className="clickable"
              style={{
                alignSelf: 'flex-start',
                padding: '5px 10px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#F59E0B',
                fontWeight: '600',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowRight size={12} /> 前往【工作台首选项】配置凭据
            </button>
          )}
        </div>
      )}

      {/* 1. 日期选择与快捷胶囊 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={13} color="var(--accent-color)" />
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>日志归属日期</label>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              flex: 1,
              minWidth: '130px',
              padding: '8px 10px',
              fontSize: '13px'
            }}
          />
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            <button
              onClick={() => setQuickDate(0)}
              className="clickable"
              style={{
                padding: '7px 11px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              今天
            </button>
            <button
              onClick={() => setQuickDate(1)}
              className="clickable"
              style={{
                padding: '7px 11px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              昨天
            </button>
            <button
              onClick={() => setQuickDate(2)}
              className="clickable"
              style={{
                padding: '7px 11px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
            >
              前天
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 岗位与语气风格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Briefcase size={12} color="var(--accent-color)" />
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>预设工作岗位</label>
          </div>
          <select 
            value={job} 
            onChange={(e) => handleJobChange(e.target.value)}
            style={{ padding: '7px 9px', fontSize: '12px' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <SlidersHorizontal size={12} color="var(--accent-color)" />
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>排版详略模式</label>
          </div>
          <select 
            value={tone} 
            onChange={(e) => handleToneChange(e.target.value)}
            style={{ padding: '7px 9px', fontSize: '12px' }}
          >
            <option value="professional">专业严谨 (量化闭环)</option>
            <option value="geek">技术细节 (极客深度)</option>
            <option value="daily">日常写实 (工作流记录)</option>
            <option value="concise">简明干练 (敏捷汇报)</option>
          </select>
        </div>
      </div>

      {job === 'custom' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>自定义岗位名称</label>
          <input
            type="text"
            value={customJobName}
            onChange={(e) => setCustomJobName(e.target.value)}
            onBlur={handleCustomJobNameBlur}
            placeholder="例如：后端架构师、数据分析师、运营专家"
            style={{ padding: '7px 10px', fontSize: '12px' }}
          />
        </div>
      )}

      {/* 2. 工作状态模式 Bento 选择器 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>工作状态模式</label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {mode === 'task' ? '自定义输入推进任务' : mode === 'idle' ? '无特定任务日常维护' : mode === 'study' ? '架构升级与技术预研' : 'Markdown 事项模板'}
          </span>
        </div>

        <div className="mode-bento-grid">
          {/* 模式 1: 迭代任务 */}
          <div
            onClick={() => setMode('task')}
            className={`mode-bento-card ${mode === 'task' ? 'active' : ''}`}
            style={{ padding: '10px 12px', gap: '6px' }}
          >
            <div className="mode-bento-card-top">
              <div className="mode-bento-icon-box" style={{ width: '24px', height: '24px' }}>
                <Rocket size={13} />
              </div>
              <span className="mode-bento-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>日常推进</span>
            </div>
            <div className="mode-bento-title" style={{ fontSize: '13px' }}>迭代任务</div>
            <div className="mode-bento-desc">输入今日要点自动提炼</div>
          </div>

          {/* 模式 2: 系统维护 */}
          <div
            onClick={() => {
              setMode('idle');
              if (fetchDirections) {
                fetchDirections(false, customDirectionNote);
              }
            }}
            className={`mode-bento-card ${mode === 'idle' ? 'active' : ''}`}
            style={{ padding: '10px 12px', gap: '6px' }}
          >
            <div className="mode-bento-card-top">
              <div className="mode-bento-icon-box" style={{ width: '24px', height: '24px' }}>
                <Coffee size={13} />
              </div>
              <span className="mode-bento-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>5选1推荐</span>
            </div>
            <div className="mode-bento-title" style={{ fontSize: '13px' }}>系统维护</div>
            <div className="mode-bento-desc">无任务时挑选日常事项</div>
          </div>

          {/* 模式 3: 架构预研 */}
          <div
            onClick={() => {
              setMode('study');
              if (fetchDirections) {
                fetchDirections(false, customDirectionNote);
              }
            }}
            className={`mode-bento-card ${mode === 'study' ? 'active' : ''}`}
            style={{ padding: '10px 12px', gap: '6px' }}
          >
            <div className="mode-bento-card-top">
              <div className="mode-bento-icon-box" style={{ width: '24px', height: '24px' }}>
                <BookOpen size={13} />
              </div>
              <span className="mode-bento-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>技术沉淀</span>
            </div>
            <div className="mode-bento-title" style={{ fontSize: '13px' }}>架构预研</div>
            <div className="mode-bento-desc">新技术探索与深度复盘</div>
          </div>

          {/* 模式 4: 事项模板 */}
          <div
            onClick={() => setMode('ai_prompt')}
            className={`mode-bento-card ${mode === 'ai_prompt' ? 'active' : ''}`}
            style={{ padding: '10px 12px', gap: '6px' }}
          >
            <div className="mode-bento-card-top">
              <div className="mode-bento-icon-box" style={{ width: '24px', height: '24px' }}>
                <FileCode size={13} />
              </div>
              <span className="mode-bento-badge" style={{ fontSize: '10px', padding: '1px 6px' }}>规范草稿</span>
            </div>
            <div className="mode-bento-title" style={{ fontSize: '13px' }}>事项模板</div>
            <div className="mode-bento-desc">生成跨系统标准化文档</div>
          </div>
        </div>
      </div>

      {/* 3. 核心内容交互区 */}
      {mode === 'task' || mode === 'ai_prompt' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              {mode === 'ai_prompt' ? '输入事项要点草稿 (用于生成格式化 Markdown 规范模板)' : '输入今日核心事项要点 (用逗号或换行分隔)'}
            </label>
            {directions.length > 0 && (
              <span
                onClick={() => setMode('idle')}
                className="clickable"
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Compass size={11} /> 切换为 5 选 1 推荐 &rarr;
              </span>
            )}
          </div>
          <textarea
            placeholder={mode === 'ai_prompt' ? "例如：完成用户鉴权中间件编写，排查慢查询日志并补齐索引" : "例如：支付中台、CRM系统；或具体事项：排查慢 SQL 接口耗时，联调权限拦截中间件"}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            style={{
              flex: 1,
              resize: 'none',
              minHeight: '120px',
              lineHeight: '1.6',
              fontSize: '13px',
              padding: '10px 12px'
            }}
          />
        </div>
      ) : (
        /* ── 无任务 / 技术预研模式：今日工作方向灵感罗盘 ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={14} color="var(--accent-color)" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {mode === 'study'
                  ? (customDirectionNote.trim() ? `【${customDirectionNote.trim()}】架构预研推荐 (5选1)` : '架构预研与探索推荐库 (5选1)')
                  : (customDirectionNote.trim() ? `【${customDirectionNote.trim()}】系统维护推荐 (5选1)` : '日常系统维护事项推荐库 (5选1)')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isFetchingDirections ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--accent-color)',
                    fontWeight: '700',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Sparkles size={11} className="animate-spin" /> AI 发散中...
                </span>
              ) : !isOfflineDirections ? (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#10B981',
                    fontWeight: '700',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Sparkles size={11} /> AI 实时提炼
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    color: '#F59E0B',
                    fontWeight: '700',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Compass size={11} /> 专家场景库
                </span>
              )}

              {fetchDirections && (
                <button
                  onClick={() => fetchDirections(true, customDirectionNote)}
                  disabled={isFetchingDirections}
                  className="clickable"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: 'var(--glass-surface-subtle)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: isFetchingDirections ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RefreshCw size={11} className={isFetchingDirections ? 'animate-spin' : ''} />
                  <span>换一批</span>
                </button>
              )}
            </div>
          </div>

          {/* 嵌入式平台发散中枢搜索条 (Sleek Inline Platform Hub) */}
          {setCustomDirectionNote && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.18)',
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'stretch' }}>
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
                  placeholder="输入负责系统/平台，如：支付中台、CRM系统、宁波数据看板..."
                  style={{
                    flex: 1,
                    fontSize: '12px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-primary)'
                  }}
                />
                {fetchDirections && (
                  <button
                    onClick={() => fetchDirections(true, customDirectionNote)}
                    disabled={isFetchingDirections}
                    className="clickable btn-shimmer-effect"
                    style={{
                      padding: '0 10px',
                      borderRadius: '8px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isFetchingDirections ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    <Sparkles size={11} className={isFetchingDirections ? 'animate-spin' : ''} />
                    <span>智能发散</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>推荐平台:</span>
                {['支付中台', 'CRM系统', '移动小程序', '业务数据大盘', '用户鉴权中心'].map((plat) => (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => {
                      setCustomDirectionNote(plat);
                      if (fetchDirections) fetchDirections(true, plat);
                    }}
                    className="clickable"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      background: customDirectionNote === plat ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: customDirectionNote === plat ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: customDirectionNote === plat ? 'var(--accent-color)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {plat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5 个 Bento 风格悬浮液态玻璃方向卡片 / 骨架流光屏 */}
          {isFetchingDirections ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="direction-skeleton-card" style={{ padding: '9px 11px', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '70%' }}>
                      <div className="skeleton-shimmer-bar" style={{ width: '48px', height: '16px' }} />
                      <div className="skeleton-shimmer-bar" style={{ width: '60%', height: '16px' }} />
                    </div>
                    <div className="skeleton-shimmer-bar" style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                  </div>
                  <div className="skeleton-shimmer-bar" style={{ width: '92%', height: '12px', marginTop: '1px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {directions.map((dir, idx) => {
                const isSelected = selectedDirectionId === dir.id;
                return (
                  <div
                    key={dir.id || idx}
                    onClick={() => selectDirection && selectDirection(dir.id)}
                    className={`clickable stagger-item-${(idx % 5) + 1} ${isSelected ? 'pulse-glow-badge' : ''}`}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.14)' : 'var(--glass-surface-subtle)',
                      border: isSelected ? '1.5px solid var(--accent-color)' : '1px solid var(--glass-border)',
                      boxShadow: isSelected ? '0 0 14px var(--accent-glow)' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '1px 5px',
                            borderRadius: '5px',
                            background: isSelected ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
                            color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                          }}
                        >
                          {dir.tag || (mode === 'study' ? '技术预研' : '日常维护')}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                          {idx + 1}. {dir.title}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 size={14} color="var(--accent-color)" />}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.35', paddingLeft: '2px' }}>
                      {dir.summary}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. 一键生成流光操作按钮 */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="clickable glow-btn btn-shimmer-effect"
        style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 6px 20px var(--accent-glow)',
          cursor: generating ? 'not-allowed' : 'pointer',
          opacity: generating ? 0.7 : 1,
          marginTop: '2px'
        }}
      >
        <Sparkles size={15} className={generating ? 'animate-spin' : ''} />
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
