/**
 * 赢日志 (Winner Daily) — 京东云直接连接更新部署脚本
 * 凭据规范遵循: D:\ai\_ops\jd-cloud\secrets\connect.json
 * 极速规范对标: D:\ai\_ops\jd-cloud\docker-node-deploy.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client } = require('ssh2');

const APP_DIR = __dirname;
const CONFIG_PATH = 'D:/ai/_ops/jd-cloud/secrets/connect.json';
const DEPLOY_TARGET = '/opt/winner-daily';
const PUBLIC_PORT = 7899;

async function main() {
  console.log('======================================================');
  console.log('🚀 启动本地直连京东云极速更新部署流水线');
  console.log('======================================================\n');

  // 1. 读取连接凭据
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`未找到京东云配置文件: ${CONFIG_PATH}`);
  }
  const connectConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const host = connectConfig.host || '111.228.44.255';
  const port = connectConfig.port || 22;
  const username = connectConfig.user_name || 'root';
  const password = connectConfig.password;

  console.log(`📡 目标主机: ${username}@${host}:${port}`);
  console.log(`📁 部署目录: ${DEPLOY_TARGET}`);
  console.log(`🌐 服务端口: http://${host}:${PUBLIC_PORT}\n`);

  // 2. 本地高性能环境打包
  console.log('📦 [1/4] 本地高性能环境执行 Vite 生产打包...');
  execSync('npm run build', { cwd: APP_DIR, stdio: 'inherit' });
  console.log('✅ 前端构建完成！\n');

  // 3. 打包归档文件
  console.log('📦 [2/4] 生成项目核心发布归档包...');
  const timestamp = Date.now();
  const archiveName = `winner-daily-release-${timestamp}.tar.gz`;
  const localArchive = path.join(APP_DIR, archiveName);
  const remoteArchive = `/tmp/${archiveName}`;

  if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);

  // 使用系统 tar 打包必需文件
  execSync(
    `tar -czf "${archiveName}" dist server server.js Dockerfile docker-compose.yml package.json package-lock.json`,
    { cwd: APP_DIR, stdio: 'inherit' }
  );
  console.log(`✅ 归档生成完成: ${archiveName} (${(fs.statSync(localArchive).size / 1024 / 1024).toFixed(2)} MB)\n`);

  // 4. SSH & SFTP 连接
  console.log('🔌 [3/4] 直连京东云服务器并上传发布包...');
  const conn = new Client();

  await new Promise((resolve, reject) => {
    conn.on('ready', resolve);
    conn.on('error', reject);
    conn.connect({
      host,
      port,
      username,
      password,
      readyTimeout: 30000
    });
  });
  console.log('✅ SSH 连接建立成功！');

  // 上传文件
  await new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      console.log(`🚀 正在通过 SFTP 上传至 ${remoteArchive}...`);
      const readStream = fs.createReadStream(localArchive);
      const writeStream = sftp.createWriteStream(remoteArchive);

      writeStream.on('close', () => {
        console.log('✅ 传输完成！\n');
        resolve();
      });
      writeStream.on('error', reject);
      readStream.pipe(writeStream);
    });
  });

  // 本地删除临时归档
  if (fs.existsSync(localArchive)) fs.unlinkSync(localArchive);

  // 5. 远程解压与 Docker 重构启动
  console.log('🐳 [4/4] 远程执行容器更新与热重启...');
  const remoteCmd = `
set -e
echo ">>> 1. 备份现有数据与解压更新..."
mkdir -p ${DEPLOY_TARGET} /var/backups /tmp/release-temp
if [ -d "${DEPLOY_TARGET}" ]; then
  cp -a ${DEPLOY_TARGET} /var/backups/winner-daily-$(date +%Y%m%d%H%M%S)
fi
if [ -f "${DEPLOY_TARGET}/db.json" ]; then
  cp -a ${DEPLOY_TARGET}/db.json /tmp/db-pre-deploy.json
fi

tar -xzf ${remoteArchive} -C /tmp/release-temp
rm -f ${remoteArchive}

rsync -av --exclude="db.json" /tmp/release-temp/ ${DEPLOY_TARGET}/ || cp -a /tmp/release-temp/* ${DEPLOY_TARGET}/
rm -rf /tmp/release-temp

if [ ! -f "${DEPLOY_TARGET}/db.json" ]; then
  if [ -f "/tmp/db-pre-deploy.json" ]; then
    cp -a /tmp/db-pre-deploy.json ${DEPLOY_TARGET}/db.json
  else
    printf '{\\n  "users": {}\\n}\\n' > ${DEPLOY_TARGET}/db.json
  fi
fi

cd ${DEPLOY_TARGET}

echo ">>> 2. 重建并启动 Docker 容器服务..."
docker build -t winner-daily:latest .
docker rm -f winner-daily >/dev/null 2>&1 || true
docker run -d \\
  --name winner-daily \\
  --restart always \\
  -p 127.0.0.1:3001:3001 \\
  -v ${DEPLOY_TARGET}/db.json:/app/db.json \\
  winner-daily:latest

echo ">>> 3. Nginx 热重载与冒烟检查..."
sleep 3
nginx -t && (nginx -s reload || systemctl reload nginx)
curl -sI http://127.0.0.1:3001/api/data | head -n 1 || true
docker ps | grep winner-daily || true
echo ">>> 部署执行成功！"
`;

  await new Promise((resolve, reject) => {
    conn.exec(remoteCmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`远程执行失败，退出码: ${code}`));
        }
      });
      stream.on('data', (data) => process.stdout.write(data));
      stream.stderr.on('data', (data) => process.stderr.write(data));
    });
  });

  conn.end();

  console.log('\n======================================================');
  console.log('🎉 京东云直连部署更新完全成功！');
  console.log(`🌐 线上访问地址: http://${host}:${PUBLIC_PORT}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n❌ 直连部署失败:', err.message);
  process.exit(1);
});
