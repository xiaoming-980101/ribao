import fs from 'fs';
import path from 'path';
import { DB_FILE, BACKUP_DIR } from './config.js';
import { hashPassword } from './utils/password.js';

export function createDefaultSettings(overrides = {}) {
  return {
    job: 'frontend',
    customJobName: '',
    tone: 'professional',
    similarityThreshold: 50,
    rollingDays: 7,
    aiApiKey: '',
    aiApiUrl: 'https://openrouter.ai/api/v1',
    aiModel: 'openrouter/free',
    aiEnabled: false,
    saveKeyToCloud: true,
    ...overrides
  };
}

export function initDB() {
  const defaultData = {
    users: {
      admin: {
        password: hashPassword('admin123'),
        logs: {},
        settings: createDefaultSettings()
      }
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    return;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    
    if (!data.users || Object.keys(data.users).length === 0) {
      console.log('检测到数据库中无任何账号或格式不兼容，正在自动注入/迁移默认账号: admin...');
      const migratedLogs = data.logs || {};
      const migratedSettings = data.settings || createDefaultSettings();
      
      const upgradedData = {
        users: {
          admin: {
            password: hashPassword('admin123'),
            logs: migratedLogs,
            settings: migratedSettings
          }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(upgradedData, null, 2), 'utf8');
      console.log('默认账号注入/迁移成功 (密码: admin123)！');
    }
  } catch (e) {
    console.error('初始化数据库失败，重置为默认账号结构:', e);
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

export function readDB() {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据库失败:', error);
    return { users: {} };
  }
}

export function backupDBSnapshot() {
  try {
    if (!fs.existsSync(DB_FILE)) return;
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetFile = path.join(BACKUP_DIR, `db-snapshot-${todayStr}.json`);

    // 如果当天快照不存在，或者已有快照体积较小，则复制创建备份
    if (!fs.existsSync(targetFile)) {
      fs.copyFileSync(DB_FILE, targetFile);
      console.log(`[db backup] 已自动生成今日物理数据库安全快照: db-snapshot-${todayStr}.json`);
    }

    // 自动清理超过 7 天的历史快照
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('db-snapshot-') && f.endsWith('.json'));
    if (files.length > 7) {
      files.sort(); // 按文件名日期升序
      while (files.length > 7) {
        const toDelete = files.shift();
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, toDelete));
          console.log(`[db backup] 已自动清理历史过期快照: ${toDelete}`);
        } catch (_) {}
      }
    }
  } catch (err) {
    console.warn('[db backup] 创建快照备份失败 (非致命):', err.message);
  }
}

// 写入数据库文件，包含 Docker 卷挂载 EXDEV 跨设备重命名安全降级
export function writeDB(data) {
  backupDBSnapshot();
  const tmpFile = DB_FILE + '.tmp';
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    try {
      fs.renameSync(tmpFile, DB_FILE);
    } catch (renameError) {
      // 无论是跨设备 (EXDEV) 还是 Docker 单文件挂载导致的设备忙/锁定 (EBUSY) 等错误，均降级为复制并删除临时文件
      fs.copyFileSync(tmpFile, DB_FILE);
      fs.unlinkSync(tmpFile);
    }
    return true;
  } catch (error) {
    console.error('写入数据库失败:', error);
    try { fs.unlinkSync(tmpFile); } catch (_) { /* ignore */ }
    return false;
  }
}

export function upgradePasswordHash(username, password) {
  const db = readDB();
  const user = db.users[username];
  if (user) {
    const oldHash = user.password;
    if (oldHash && oldHash.length === 64 && !oldHash.startsWith('$2')) {
      user.password = hashPassword(password);
      writeDB(db);
      console.log(`[auth] 已自动升级用户 ${username} 的密码哈希为 bcrypt`);
    }
  }
}
