import fs from 'fs';
import { DB_FILE } from './config.js';
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
      console.log('🟢 默认账号注入/迁移成功 (密码: admin123)！');
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

export function writeDB(data) {
  const tmpFile = DB_FILE + '.tmp';
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    try {
      fs.renameSync(tmpFile, DB_FILE);
    } catch (renameError) {
      if (renameError.code === 'EXDEV') {
        fs.copyFileSync(tmpFile, DB_FILE);
        fs.unlinkSync(tmpFile);
      } else {
        throw renameError;
      }
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
