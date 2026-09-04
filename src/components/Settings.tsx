import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Check,
  Save,
  Trash2,
  Cpu,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  AppData,
  saveSettings,
  importAllData,
  resetAllData,
  BACKEND_URL,
  DEFAULT_AI_API_URL,
  DEFAULT_AI_MODEL,
  ModelOption,
  getUserAISettings,
  saveUserAISettings,
  loadCachedModels,
  saveCachedModels,
  isOpenRouterApiUrl,
  getAuthHeaders
} from '../utils/storage';

interface SettingsProps {
  appData: AppData;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const getDefaultModelOptions = (aiApiUrl: string): ModelOption[] => (
  isOpenRouterApiUrl(aiApiUrl)
    ? [
        { id: DEFAULT_AI_MODEL, name: 'OpenRouter: Free Auto-Route (免费自动路由)', isFree: true },
        { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Google: Gemini 2.0 Flash Lite (Free)', isFree: true },
        { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', isFree: false }
      ]
    : [
        { id: 'openrouter-free', name: 'openrouter-free (聚合网关免费模型池)', isFree: true }
      ]
);

const LEGACY_INVALID_MODELS = new Set([
  'qwen/qwen-3-coder:free'
]);

const normalizeModelId = (modelId: string, aiApiUrl: string) => {
  const isOpenRouterApi = isOpenRouterApiUrl(aiApiUrl);
  if (!isOpenRouterApi && modelId === DEFAULT_AI_MODEL) return '';
  if (LEGACY_INVALID_MODELS.has(modelId)) return isOpenRouterApi ? DEFAULT_AI_MODEL : '';
  return modelId;
};

export default function Settings({ appData, onSaveSuccess, showToast }: SettingsProps) {
  const [job, setJob] = useState<string>('frontend');
  const [customJobName, setCustomJobName] = useState<string>('');
  const [tone, setTone] = useState<string>('professional');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(50);
  const [rollingDays, setRollingDays] = useState<number>(7);
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [aiApiUrl, setAiApiUrl] = useState<string>(DEFAULT_AI_API_URL);
  const [aiModel, setAiModel] = useState<string>(DEFAULT_AI_MODEL);
  const [saveKeyToCloud, setSaveKeyToCloud] = useState<boolean>(true);
  
  // ── 模型列表与搜索状态 ──
  const [modelList, setModelList] = useState<ModelOption[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpenRouterApiUrl(aiApiUrl) && (aiModel === DEFAULT_AI_MODEL || LEGACY_INVALID_MODELS.has(aiModel))) {
      setAiModel('openrouter-free');
    }
  }, [aiApiUrl, aiModel]);

  // 加载缓存的模型列表
  useEffect(() => {
    const cached = loadCachedModels(aiApiUrl) || getDefaultModelOptions(aiApiUrl);
    setModelList(cached);
  }, [aiApiUrl]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSyncModels = async () => {
    if (!aiApiKey) {
      showToast('请先填写引擎服务凭据 (API Key)，再点击同步！', 'error');
      return;
    }
    setIsSyncing(true);
    showToast('正在同步云端大模型可用型号列表...', 'info');
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/models`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ aiApiKey, aiApiUrl })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '请求失败');
      }

      const resData = await response.json();
      if (resData.success && resData.models && resData.models.length > 0) {
        setModelList(resData.models);
        saveCachedModels(resData.models, aiApiUrl);
        setIsDropdownOpen(true);
        showToast(`成功同步 ${resData.models.length} 个可用模型！已为您展开选择列表。`, 'success');
      } else {
        throw new Error('未返回可用模型列表');
      }
    } catch (err: any) {
      console.error('同步可用引擎失败:', err);
      showToast(`同步模型失败: ${err.message || err}，已保留预设候选列表。`, 'error');
      setModelList(getDefaultModelOptions(aiApiUrl));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetData = async () => {
    const confirm1 = window.confirm(
      '危险操作警示：\n\n该操作将永久擦除您在本地保存的所有工作日志、周报历史以及岗位参数配置，将其彻底恢复到出厂初始状态！\n\n此操作不可撤销，您真的确定要继续吗？'
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      '请再次确认：\\n\\n在清空数据前，强烈建议您在右侧点击“下载全部数据备份 (JSON)”保存您的本地日志备份。\\n\\n您是否已经做好了备份，并确定要抹除所有本地数据？'
    );
    if (!confirm2) return;

    const res = await resetAllData();
    if (res.success) {
      showToast('系统已彻底恢复出厂初始状态！', 'info');
      onSaveSuccess();
    } else {
      showToast(`恢复出厂设置失败：${res.error || '服务端拒绝了本次操作'}。本地数据未被清除。`, 'error');
    }
  };

  useEffect(() => {
    if (appData && appData.settings) {
      const s = appData.settings;
      setJob(s.job || 'frontend');
      setCustomJobName(s.customJobName || '');
      setTone(s.tone || 'professional');
      setSimilarityThreshold(s.similarityThreshold ?? 50);
      setRollingDays(s.rollingDays ?? 7);

      const localAI = getUserAISettings();
      const currentUrl = (localAI && localAI.aiApiUrl !== undefined) ? localAI.aiApiUrl : (s.aiApiUrl || DEFAULT_AI_API_URL);
      const rawModel = (localAI && localAI.aiModel !== undefined) ? localAI.aiModel : (s.aiModel || (isOpenRouterApiUrl(currentUrl) ? DEFAULT_AI_MODEL : 'openrouter-free'));

      setAiEnabled((localAI && localAI.aiEnabled !== undefined) ? localAI.aiEnabled : (s.aiEnabled || false));
      setAiApiKey((localAI && localAI.aiApiKey !== undefined) ? localAI.aiApiKey : (s.aiApiKey || ''));
      setAiApiUrl(currentUrl);
      setAiModel(normalizeModelId(rawModel, currentUrl));
      setSaveKeyToCloud(s.saveKeyToCloud !== undefined ? s.saveKeyToCloud : true);
    }
  }, [appData]);

  const handleSaveSettings = async () => {
    const newSettings = {
      job,
      customJobName: job === 'custom' ? customJobName.trim() : '',
      tone,
      similarityThreshold: Number(similarityThreshold),
      rollingDays: Number(rollingDays),
      aiEnabled,
      aiApiKey: saveKeyToCloud ? aiApiKey.trim() : '',
      aiApiUrl: aiApiUrl.trim() || DEFAULT_AI_API_URL,
      aiModel: aiModel.trim() || (isOpenRouterApiUrl(aiApiUrl) ? DEFAULT_AI_MODEL : 'openrouter-free'),
      saveKeyToCloud
    };

    saveUserAISettings({
      aiEnabled,
      aiApiKey: aiApiKey.trim(),
      aiApiUrl: newSettings.aiApiUrl,
      aiModel: newSettings.aiModel
    });

    try {
      const res = await saveSettings(newSettings);
      if (res.success) {
        setSaveStatus(true);
        showToast('工作台参数及引擎凭据配置已成功保存！', 'success');
        onSaveSuccess();
        setTimeout(() => setSaveStatus(false), 2500);
      } else {
        showToast(`保存失败：${res.error || '服务端拒绝了本次写入'}`, 'error');
      }
    } catch (e: any) {
      console.warn('在线保存配置失败，已保存至本地');
      setSaveStatus(true);
      showToast('配置已保存至当前浏览器本地存储！', 'success');
      setTimeout(() => setSaveStatus(false), 2500);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const date = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `DevTask_Backup_${date}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('本地事项数据备份已成功导出！', 'success');
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && (json.logs || json.settings)) {
          const res = await importAllData(json);
          if (res.success) {
            showToast(
              res.isOffline
                ? '数据已恢复至本地，联网后将自动同步至服务器...'
                : '数据已成功恢复！正在刷新工作台...',
              res.isOffline ? 'info' : 'success'
            );
            onSaveSuccess();
          } else {
            showToast(`导入失败：${res.error || '服务端拒绝了本次写入'}`, 'error');
          }
        } else {
          showToast('导入文件格式不合法，请上传正确的备份 JSON 文件！', 'error');
        }
      } catch (err) {
        showToast('文件解析失败，请确保上传的是合法的 JSON 格式备份！', 'error');
      }
    };
    reader.readAsText(file);
  };

  // 过滤模型列表
  const filteredModels = modelList.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    if (q === 'free') return m.isFree;
    return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', flex: 1, maxWidth: '1100px' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* 头部标题 */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>工作台首选项与环境配置</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          定制岗位预设、语法引擎接口、模型选择与本地数据备份管理。
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {/* 1. 基础岗位与排版参数 */}
        <div className="liquid-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>基础环境与归档参数 (Preferences)</h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>预设工作岗位</label>
              <select value={job} onChange={(e) => setJob(e.target.value)}>
                <option value="frontend">前端开发工程师</option>
                <option value="backend">后端开发工程师</option>
                <option value="fullstack">全栈开发工程师</option>
                <option value="tester">测试工程师</option>
                <option value="designer">UI/UX 视觉设计师</option>
                <option value="pm">产品经理</option>
                <option value="devops">运维与SRE工程师</option>
                <option value="custom">自定义岗位</option>
              </select>
            </div>

            {job === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>自定义岗位名称</label>
                <input
                  type="text"
                  value={customJobName}
                  onChange={(e) => setCustomJobName(e.target.value)}
                  placeholder="例如：前端架构师、数据分析师"
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>事项排版详略模式</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">专业严谨型 (量化闭环，描述详实)</option>
                <option value="daily">日常写实型 (工作流记录)</option>
              </select>
            </div>

            {/* 格式校验滑块 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>格式一致性校验阈值</label>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>{similarityThreshold}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="80"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
            </div>

            {/* 事项归档周期滑块 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>事项归档统计周期窗口</label>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-color)' }}>{rollingDays} 天</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={rollingDays}
                onChange={(e) => setRollingDays(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="clickable"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 20px',
              borderRadius: '12px',
              background: saveStatus ? '#10B981' : 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px var(--accent-glow)'
            }}
          >
            {saveStatus ? <Check size={14} /> : <Save size={14} />}
            <span>{saveStatus ? '参数已生效' : '保存基础参数'}</span>
          </button>
        </div>

        {/* 2. 智能排版与分析引擎 (含模型选择与搜索) */}
        <div className="liquid-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>智能排版与分析引擎 (Engine Service)</h3>
            </div>
            {aiEnabled && (
              <button
                onClick={handleSyncModels}
                disabled={isSyncing}
                className="clickable"
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
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
                <RefreshCw size={12} style={isSyncing ? { animation: 'spin 1s linear infinite' } : undefined} />
                <span>{isSyncing ? '正在同步...' : '同步模型列表'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="aiEnabled"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="aiEnabled" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
                启用在线智能语法与格式化引擎
              </label>
            </div>

            {aiEnabled && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>API 接口地址 (Base URL)</label>
                  <input
                    type="text"
                    value={aiApiUrl}
                    onChange={(e) => setAiApiUrl(e.target.value)}
                    placeholder="例如: http://111.228.44.255:7880/v1"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>API Key 密钥</label>
                  <input
                    type="password"
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-octopus-..."
                  />
                </div>

                {/* 🌟 核心：支持搜索与下拉选择的大模型选择器 🌟 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }} ref={dropdownRef}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      已选大模型型号 (Model ID)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--accent-color)', fontWeight: '600' }}>
                      支持直接键入或点击右侧展开选择
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="例如: openrouter-free 或 openrouter/free"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="clickable"
                      style={{
                        padding: '10px 14px',
                        background: isDropdownOpen ? 'var(--accent-gradient)' : 'var(--glass-surface-subtle)',
                        border: '1px solid ' + (isDropdownOpen ? 'rgba(255,255,255,0.3)' : 'var(--glass-border)'),
                        borderRadius: '12px',
                        color: isDropdownOpen ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: isDropdownOpen ? '0 4px 12px var(--accent-glow)' : 'none'
                      }}
                      title="点击展开可用模型列表与快速检索"
                    >
                      <Search size={14} />
                      <span>{isDropdownOpen ? '收起' : '选择/搜索'}</span>
                      {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* 内联展开模型检索面板 (绝不被下方元素遮挡) */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        marginTop: '10px',
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 24px rgba(0, 0, 0, 0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* 搜索框 */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="输入模型名称、ID 或厂商快速过滤 (例如: free, gemma, qwen)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 34px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            border: '1px solid var(--glass-border)'
                          }}
                          autoFocus
                        />
                      </div>

                      {/* 模型列表 */}
                      <div
                        style={{
                          maxHeight: '260px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          paddingRight: '4px'
                        }}
                      >
                        {filteredModels.length > 0 ? (
                          filteredModels.map((m) => {
                            const isSelected = aiModel === m.id;
                            const isFree = m.isFree || m.id.includes('free');
                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setAiModel(m.id);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                  showToast(`已选定模型: ${m.id}`, 'info');
                                }}
                                className="clickable"
                                style={{
                                  padding: '9px 12px',
                                  borderRadius: '10px',
                                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                                  border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--glass-border-subtle)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                  <div style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {m.name || m.id}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {m.id}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                  {isFree && (
                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', fontWeight: '700' }}>
                                      免费
                                    </span>
                                  )}
                                  {isSelected && <Check size={14} color="var(--accent-color)" />}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            未找到匹配的模型，您可以直接在上方输入框键入该模型 ID。
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 常用预置模型快捷微标签 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>常用推荐:</span>
                    {[
                      { id: 'openrouter-free', label: 'openrouter-free (聚合免费池)' },
                      { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', label: 'Gemini 2.0 Flash Lite' },
                      { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setAiModel(item.id);
                          showToast(`已选定 ${item.id}`, 'info');
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: aiModel === item.id ? 'var(--accent-gradient)' : 'var(--glass-surface-subtle)',
                          color: aiModel === item.id ? '#ffffff' : 'var(--text-secondary)',
                          border: '1px solid ' + (aiModel === item.id ? 'rgba(255,255,255,0.3)' : 'var(--glass-border-subtle)'),
                          cursor: 'pointer',
                          fontWeight: aiModel === item.id ? '700' : '500'
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSaveSettings}
            className="clickable"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 20px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px var(--accent-glow)'
            }}
          >
            <Save size={14} />
            <span>保存引擎配置凭据</span>
          </button>
        </div>

        {/* 3. 数据备份与导入恢复 */}
        <div className="liquid-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>数据备份与导入恢复</h3>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            支持将本地所有的事项数据导出为独立的 JSON 存档文件，方便离线归档或跨设备迁移。
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button
              onClick={handleExportData}
              className="clickable"
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '12px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              <span>下载全部备份 (JSON)</span>
            </button>
            <button
              onClick={handleImportClick}
              className="clickable"
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '12px',
                background: 'var(--glass-surface-subtle)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Upload size={16} />
              <span>导入 JSON 恢复</span>
            </button>
          </div>
        </div>

        {/* 4. 危险区域 */}
        <div className="liquid-glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} color="#EF4444" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#EF4444' }}>危险区域 / 恢复出厂设置</h3>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            该操作将永久擦除当前本地所有事项记录、历史日志与个性化配置参数，重置为初次安装状态。
          </p>

          <button
            onClick={handleResetData}
            className="clickable"
            style={{
              marginTop: 'auto',
              padding: '11px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Trash2 size={16} />
            <span>彻底重置所有本地数据</span>
          </button>
        </div>
      </div>
    </div>
  );
}
