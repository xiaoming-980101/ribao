import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Download, Upload, Check, Save, Trash2, Cpu, RefreshCw } from 'lucide-react';
import { AppData, saveSettings, importAllData, resetAllData, BACKEND_URL } from '../utils/storage';

interface SettingsProps {
  appData: AppData;
  onSaveSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// 智能识别核心免费推荐大模型 (对中文大白话生成效果最佳且免费的型号)
const checkIsRecommended = (m: { id: string; name: string; isFree: boolean }) => {
  const idLower = m.id.toLowerCase();
  
  // 针对 openrouter/free 自动路由模型的特殊匹配
  if (idLower === 'openrouter/free' || idLower.includes('openrouter/free')) {
    return true;
  }
  
  // 必须是免费模型，且符合我们推荐的关键型号
  if (m.isFree) {
    // 1. Qwen 3 Coder 系列 (包含 qwen, 3, coder)
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('coder')) {
      return true;
    }
    // 2. Qwen 3 Next 系列 (包含 qwen, 3, next)
    if (idLower.includes('qwen') && idLower.includes('3') && idLower.includes('next')) {
      return true;
    }
    // 3. Llama 3.3 系列 (包含 llama, 3.3)
    if (idLower.includes('llama') && idLower.includes('3.3')) {
      return true;
    }
    // 4. Gemma 系列 (包含 gemma)
    if (idLower.includes('gemma')) {
      return true;
    }
  }
  return false;
};

export default function Settings({ appData, onSaveSuccess, showToast }: SettingsProps) {
  const [job, setJob] = useState<string>('frontend');
  const [tone, setTone] = useState<string>('professional');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(50);
  const [rollingDays, setRollingDays] = useState<number>(7);
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [aiApiKey, setAiApiKey] = useState<string>('');
  const [aiApiUrl, setAiApiUrl] = useState<string>('https://openrouter.ai/api/v1');
  const [aiModel, setAiModel] = useState<string>('qwen/qwen-3-coder:free');
  const [saveKeyToCloud, setSaveKeyToCloud] = useState<boolean>(false);
  
  // 大模型动态同步与可搜索下拉框所需状态
  const [modelList, setModelList] = useState<{ id: string; name: string; isFree: boolean }[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 恢复大模型本地列表缓存
  useEffect(() => {
    const cached = localStorage.getItem('winner_daily_cached_models');
    if (cached) {
      try {
        setModelList(JSON.parse(cached));
      } catch (e) {
        console.error('加载缓存大模型列表失败:', e);
      }
    } else {
      // 预设默认免费大模型
      setModelList([
        { id: 'openrouter/free', name: 'OpenRouter: Free Auto-Route (避堵推荐-免排队自动免费路由)', isFree: true },
        { id: 'qwen/qwen-3-coder:free', name: 'Qwen: Qwen3 Coder 480B (推荐-中文口语最强-免费)', isFree: true },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct (免费)', isFree: true },
        { id: 'google/gemma-2-9b-it:free', name: 'Google: Gemma 2 9B (免费)', isFree: true },
        { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen: Qwen 2.5 72B Instruct (免费)', isFree: true }
      ]);
    }
  }, []);

  // 一键同步云端大模型列表
  const handleSyncModels = async () => {
    if (!aiApiKey) {
      showToast('⚠️ 请先填写大模型 API Key 密钥，再点击同步！', 'error');
      return;
    }
    setIsSyncing(true);
    showToast('🔄 正在同步云端大模型可用型号列表...', 'info');
    try {
      const response = await fetch(`${BACKEND_URL}/api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiApiKey, aiApiUrl })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || '请求失败');
      }

      const resData = await response.json();
      if (resData.success && resData.models) {
        setModelList(resData.models);
        localStorage.setItem('winner_daily_cached_models', JSON.stringify(resData.models));
        showToast(`🎉 成功同步 ${resData.models.length} 个可用模型！免费大模型已置顶推荐。`, 'success');
      }
    } catch (err: any) {
      console.error('同步模型列表失败:', err);
      showToast(`❌ 同步模型失败: ${err.message || err}，请核对密钥及 API 接口地址。`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 恢复出厂设置（清空所有数据，供分发或重置）
  const handleResetData = async () => {
    const confirm1 = window.confirm(
      '⚠️ 危险操作警示：\n\n该操作将永久擦除您在本地保存的所有工作日志、周报历史以及岗位参数配置，将其彻底恢复到出厂初始状态！\n\n此操作不可撤销，您真的确定要继续吗？'
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      '⚠️ 请再次确认：\n\n在清空数据前，强烈建议您在右侧点击“下载全部数据备份 (JSON)”保存您的本地日志备份。\n\n您是否已经做好了备份，并确定要抹除所有本地数据？'
    );
    if (!confirm2) return;

    const res = await resetAllData();
    if (res.success) {
      showToast('🎉 系统已成功恢复出厂设置，所有数据已清空！', 'success');
      onSaveSuccess();
      // 延迟 1.5 秒重新加载页面，让所有状态归零
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToast('❌ 重置失败，请检查服务连接状态。', 'error');
    }
  };

  // 初始化设置值
  useEffect(() => {
    const currentLoggedUser = localStorage.getItem('winner_daily_user') || 'admin';
    if (appData.settings) {
      setJob(appData.settings.job || 'frontend');
      setTone(appData.settings.tone || 'professional');
      setSimilarityThreshold(appData.settings.similarityThreshold || 50);
      setRollingDays(appData.settings.rollingDays || 7);
      
      // 🔴 智能判定 saveKeyToCloud 的勾选状态：
      // 如果后端 settings.saveKeyToCloud 明确存在定义（不管 true/false），均以它为准；
      // 如果未定义（如新注册用户），则默认勾选为 true
      const cloudSavePref = appData.settings.saveKeyToCloud !== undefined ? appData.settings.saveKeyToCloud : true;
      setSaveKeyToCloud(cloudSavePref);

      // 如果开启了云端保存偏好，且云端存有 key，则拉起展示它
      if (cloudSavePref && appData.settings.aiApiKey) {
        setAiApiKey(appData.settings.aiApiKey);
      }
    }

    // 从本机隔离的 LocalStorage 恢复当前登录大模型配置
    const rawAISettings = localStorage.getItem(`winner_daily_ai_settings_${currentLoggedUser}`);
    if (rawAISettings) {
      try {
        const parsed = JSON.parse(rawAISettings);
        setAiEnabled(parsed.aiEnabled || false);
        
        // 判定云端偏好：若云端未开启，则加载本地浏览器里缓存的 Key
        const cloudSavePref = appData.settings?.saveKeyToCloud !== undefined ? appData.settings.saveKeyToCloud : true;
        if (!cloudSavePref && parsed.aiApiKey) {
          setAiApiKey(parsed.aiApiKey);
        }
        setAiApiUrl(parsed.aiApiUrl || 'https://openrouter.ai/api/v1');
        setAiModel(parsed.aiModel || 'qwen/qwen-3-coder:free');
      } catch (e) {
        console.error('初始化本地大模型配置失败:', e);
      }
    }
  }, [appData.settings]);

  // 保存设置
  const handleSaveSettings = async () => {
    const currentLoggedUser = localStorage.getItem('winner_daily_user') || 'admin';

    // 1. 根据是否勾选云端保存，决定是否向后端数据库上传真实的 API Key (若不勾选则在云端强制物理擦除为空)
    const res = await saveSettings({
      job,
      tone,
      similarityThreshold,
      rollingDays,
      aiApiKey: saveKeyToCloud ? aiApiKey : '', // 若用户不保存，后端强制落盘为空
      aiApiUrl,
      aiModel,
      aiEnabled
    });

    // 2. 敏感的个人大模型密钥，根据不同登录用户隔离缓存在本地 LocalStorage 中
    const localConfig = {
      aiEnabled,
      aiApiKey,
      aiApiUrl,
      aiModel
    };
    localStorage.setItem(`winner_daily_ai_settings_${currentLoggedUser}`, JSON.stringify(localConfig));
    // 兼容全局非隔离缓存，方便其他旧逻辑握手，但退出时统一擦除
    localStorage.setItem('winner_daily_ai_settings', JSON.stringify(localConfig));

    if (res.success) {
      setSaveStatus(true);
      showToast('🎉 个性化参数及大模型配置已安全保存！', 'success');
      onSaveSuccess();
      setTimeout(() => setSaveStatus(false), 2000);
    } else {
      showToast('❌ 保存配置失败，请确认后端 API 服务已正常开启！', 'error');
    }
  };

  // 备份导出（导出完整的 AppData JSON 文件）
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify(appData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `winner_daily_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (e) {
      showToast('❌ 导出备份数据失败！', 'error');
    }
  };

  // 备份导入（选择 JSON 文件覆盖本地）
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // 简单验证 JSON 结构
        if (!parsed.logs || !parsed.settings) {
          throw new Error('无效的备份数据结构');
        }

        if (confirm('导入备份将会完全覆盖您当前的日报历史数据和系统配置，该操作无法撤销。确定要继续导入吗？')) {
          const res = await importAllData(parsed);
          if (res.success) {
            setImportStatus('success');
            showToast('🎉 备份数据已导入，本地历史及配置还原成功！', 'success');
            onSaveSuccess();
            setTimeout(() => setImportStatus('idle'), 2000);
          } else {
            setImportStatus('error');
            showToast('❌ 备份数据导入失败，请检查服务状态。', 'error');
            setTimeout(() => setImportStatus('idle'), 2000);
          }
        }
      } catch (err) {
        showToast('❌ 解析备份失败，请确保文件是由本系统导出的 JSON 备份文件！', 'error');
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
      }
    };

    reader.readAsText(file);
    // 重置 input value 方便下次触发 change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, maxWidth: '800px' }}>
      {/* 标题 */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>个性化配置与备份</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          定制您的岗位、生成风格，配置查重警戒线，以及随时安全导入/导出您的日志历史。
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. 基础个性化设置 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '8px' }}>
            <SettingsIcon size={18} color="var(--accent-color)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>智能模板风格参数</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* 工作岗位 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>预设工作岗位</label>
              <select value={job} onChange={(e) => setJob(e.target.value)}>
                <option value="frontend">💻 前端开发工程师</option>
                <option value="designer">🎨 UI/UX 视觉设计师</option>
                <option value="backend" disabled>⚙️ 后端开发工程师 (敬请期待)</option>
                <option value="test" disabled>🧪 测试工程师 (敬请期待)</option>
              </select>
            </div>

            {/* 日报语气风格 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>生成语气风格</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">📋 专业严谨型（工作量饱满，措辞客观）</option>
                <option value="terse" disabled>⚡ 精简干练型（直接罗列痛点，绝不废话，敬请期待）</option>
                <option value="active" disabled>🌟 积极进取型（体现个人技术成长，敬请期待）</option>
              </select>
            </div>
          </div>

          {/* 查重报警敏感度 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                查重相似度高危阈值
              </label>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color)' }}>
                {similarityThreshold}%
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="30"
                max="80"
                value={similarityThreshold}
                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', width: '220px' }}>
                <ShieldAlert size={14} color="#F59E0B" />
                <span>当与30天内历史日志相似度超此值时报红</span>
              </div>
            </div>
          </div>

          {/* 滚动补录窗口调节 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                考勤滚动补填允许窗口期（天）
              </label>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-color)' }}>
                {rollingDays} 天
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <input
                type="range"
                min="3"
                max="30"
                value={rollingDays}
                onChange={(e) => setRollingDays(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', width: '220px' }}>
                <ShieldAlert size={14} color="#F59E0B" />
                <span>允许当天往前推 X 天内可以补写日志</span>
              </div>
            </div>
          </div>

          {/* 保存配置按钮 */}
          <button
            onClick={handleSaveSettings}
            className="clickable"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 24px',
              borderRadius: '8px',
              background: saveStatus ? '#10B981' : 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px'
            }}
          >
            {saveStatus ? <Check size={14} /> : <Save size={14} />}
            <span>{saveStatus ? '参数配置已生效' : '保存配置参数'}</span>
          </button>
        </div>

        {/* 1.5. 在线 AI 智能大模型对接 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--accent-color)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>🤖 在线 AI 智能大模型联调 (免人工复制)</h3>
            </div>
            
            {aiEnabled && (
              <button
                onClick={handleSyncModels}
                disabled={isSyncing}
                className="clickable"
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--accent-color)',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={12} className={isSyncing ? 'spin-animation' : ''} />
                <span>{isSyncing ? '正在拉取...' : '🔄 同步大模型列表'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 是否启用 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="checkbox"
                id="aiEnabled"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="aiEnabled" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer' }}>
                开启在线大模型生成模式（开启后，点击“智能生成”将直连 AI API，无需手动复制 Prompt）
              </label>
            </div>

            {aiEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '3px solid var(--accent-color)', paddingLeft: '16px', marginTop: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* API Base URL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>API Base URL (基准请求地址)</label>
                    <input
                      type="text"
                      value={aiApiUrl}
                      onChange={(e) => setAiApiUrl(e.target.value)}
                      placeholder="例如: https://openrouter.ai/api/v1"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      兼容 OpenAI 格式的大模型平台接口地址。
                    </span>
                  </div>

                  {/* API Key */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>API Key (密钥)</label>
                    <input
                      type="password"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="sk-..."
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <input 
                        type="checkbox" 
                        id="saveKeyToCloud"
                        checked={saveKeyToCloud}
                        onChange={(e) => setSaveKeyToCloud(e.target.checked)}
                        style={{ cursor: 'pointer', width: '14px', height: '14px' }}
                      />
                      <label htmlFor="saveKeyToCloud" style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                        💾 允许将 API 密钥安全备份在云端（可跨设备同步；若不勾选，密钥仅保存在当前浏览器，退出后彻底销毁）
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'end' }}>
                  {/* 可搜索大模型下拉框组件 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>自选大模型选择与检索 (免费置顶)</label>
                    
                    {/* 模拟 Select */}
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="clickable"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        minHeight: '42px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                        {aiModel ? (
                          <>
                            {modelList.find(m => m.id === aiModel)?.isFree ? '🟢 [免费] ' : '🔴 [付费] '}
                            {(() => {
                              const found = modelList.find(m => m.id === aiModel);
                              return found && checkIsRecommended(found) ? '🔥 [推荐] ' : '';
                            })()}
                            {modelList.find(m => m.id === aiModel)?.name || aiModel}
                          </>
                        ) : '点击选择模型...'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* 下拉悬浮层 */}
                    {isDropdownOpen && (
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          background: '#111827',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '10px',
                          boxShadow: '0 -10px 25px rgba(0,0,0,0.5)',
                          padding: '12px',
                          marginBottom: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          backdropFilter: 'blur(16px)',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* 搜索框 */}
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="🔍 输入 free 或 qwen 等关键字检索模型..."
                          onClick={(e) => e.stopPropagation()} // 防止冒泡关闭下拉框
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px'
                          }}
                        />

                        {/* 模型过滤结果列表 */}
                        <div 
                          style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            marginTop: '4px'
                          }}
                        >
                          {(() => {
                            const getModelWeight = (m: { id: string; name: string; isFree: boolean }) => {
                              const isRec = checkIsRecommended(m);
                              if (m.isFree && isRec) return 4; // 推荐免费置顶
                              if (m.isFree) return 3;          // 免费普通
                              if (isRec) return 2;             // 推荐付费 (虽然目前设定无)
                              return 1;                        // 付费普通
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
                                return (
                                  <div
                                    key={m.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAiModel(m.id);
                                      setIsDropdownOpen(false);
                                      setSearchQuery('');
                                    }}
                                    className="clickable"
                                    style={{
                                      padding: '8px 10px',
                                      borderRadius: '6px',
                                      background: aiModel === m.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                      border: aiModel === m.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                                      fontSize: '12px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                      color: aiModel === m.id ? '#ffffff' : 'var(--text-secondary)'
                                    }}
                                  >
                                    <span style={{ fontWeight: aiModel === m.id ? '700' : '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                      {isRec ? (m.id.toLowerCase().includes('openrouter/free') ? '🔥 [避堵路由] ' : '🔥 ') : ''}{m.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      {m.id.toLowerCase().includes('openrouter/free') && (
                                        <span 
                                          style={{
                                            fontSize: '8px',
                                            padding: '1px 4px',
                                            borderRadius: '3px',
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            color: '#3B82F6',
                                            fontWeight: '700',
                                            border: '1px solid rgba(59, 130, 246, 0.2)'
                                          }}
                                        >
                                          避堵首选
                                        </span>
                                      )}
                                      {isRec && (
                                        <span 
                                          style={{
                                            fontSize: '8px',
                                            padding: '1px 4px',
                                            borderRadius: '3px',
                                            background: 'rgba(245, 158, 11, 0.15)',
                                            color: '#F59E0B',
                                            fontWeight: '700',
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                          }}
                                        >
                                          推荐
                                        </span>
                                      )}
                                      <span 
                                        style={{
                                          fontSize: '8px',
                                          padding: '1px 4px',
                                          borderRadius: '3px',
                                          background: m.isFree ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                          color: m.isFree ? '#10B981' : '#EF4444',
                                          fontWeight: '700',
                                          border: m.isFree ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                        }}
                                      >
                                        {m.isFree ? '免费' : '付费'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                                未找到匹配的模型
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 自定义输入框兜底 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>手动补录模型 ID (非必填)</label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="如: qwen/qwen-3-coder:free"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSaveSettings}
            className="clickable"
            style={{
              alignSelf: 'flex-end',
              padding: '10px 24px',
              borderRadius: '8px',
              background: saveStatus ? '#10B981' : 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px'
            }}
          >
            {saveStatus ? <Check size={14} /> : <Save size={14} />}
            <span>{saveStatus ? '在线大模型已连通生效' : '保存大模型接口配置'}</span>
          </button>
        </div>

        {/* 2. 数据备份与灾备模块 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '8px' }}>
            <ShieldAlert size={18} color="var(--accent-color)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>数据备份与导入恢复 (防丢失)</h3>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            为保护您的历史工作痕迹，我们提供本地离线双活的实体 JSON 备份与还原功能。
            即便您在浏览器无痕模式或在未开启本地 Node.js 磁盘服务的情况下使用（导致数据存于浏览器缓存），
            您也可以定期将所有日志导出为文件保存在本地，防止因清理浏览器缓存导致日报遗失。
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {/* 备份导出 */}
            <button
              onClick={handleExportData}
              className="clickable"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
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
              <span>下载全部数据备份 (JSON)</span>
            </button>

            {/* 备份导入 */}
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="clickable"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: importStatus === 'success' ? '#10B981' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--glass-border)',
                color: importStatus === 'success' ? '#fff' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {importStatus === 'success' ? <Check size={16} /> : <Upload size={16} />}
              <span>
                {importStatus === 'success'
                  ? '备份已成功还原'
                  : importStatus === 'error'
                  ? '还原失败'
                  : '从 JSON 文件还原备份'}
              </span>
            </button>
          </div>
        </div>

        {/* 3. 系统重置与分发（危险操作） */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
            <Trash2 size={18} color="#EF4444" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444' }}>系统重置与纯净分发</h3>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            如果您想将本程序打包分享给其他人使用，或者需要清除本地的全部填报记录，您可以在此一键“恢复出厂设置”。
            系统将彻底清空本地数据库中的历史数据，并将岗位配置恢复到默认状态（建议在操作前先在上方下载备份）。
          </p>

          <button
            onClick={handleResetData}
            className="clickable"
            style={{
              alignSelf: 'flex-start',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '4px'
            }}
          >
            <Trash2 size={16} />
            <span>🧹 恢复出厂设置（清空全部数据）</span>
          </button>
        </div>
      </div>
    </div>
  );
}
