import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, ShieldAlert, Download, Upload, Check, Save } from 'lucide-react';
import { AppData, saveSettings, importAllData } from '../utils/storage';

interface SettingsProps {
  appData: AppData;
  onSaveSuccess: () => void;
}

export default function Settings({ appData, onSaveSuccess }: SettingsProps) {
  const [job, setJob] = useState<string>('frontend');
  const [tone, setTone] = useState<string>('professional');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(50);
  const [rollingDays, setRollingDays] = useState<number>(7);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化设置值
  useEffect(() => {
    if (appData.settings) {
      setJob(appData.settings.job || 'frontend');
      setTone(appData.settings.tone || 'professional');
      setSimilarityThreshold(appData.settings.similarityThreshold || 50);
      setRollingDays(appData.settings.rollingDays || 7);
    }
  }, [appData.settings]);

  // 保存设置
  const handleSaveSettings = async () => {
    const res = await saveSettings({
      job,
      tone,
      similarityThreshold,
      rollingDays
    });

    if (res.success) {
      setSaveStatus(true);
      onSaveSuccess();
      setTimeout(() => setSaveStatus(false), 2000);
    } else {
      alert('保存设置失败！');
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
      alert('导出数据备份失败！');
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
            onSaveSuccess();
            setTimeout(() => setImportStatus('idle'), 2000);
          } else {
            setImportStatus('error');
            setTimeout(() => setImportStatus('idle'), 2000);
          }
        }
      } catch (err) {
        alert('解析备份文件失败，请确保您选择的是由系统导出的正确备份 JSON 文件！');
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
      </div>
    </div>
  );
}
