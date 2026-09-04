# ==============================================================================
# 赢日志 (Winner Daily) — 本地直连京东云一键更新部署脚本
# 用途：无需推送 GitHub，本地直接打包上传至京东云服务器并重构 Docker 容器上线
# ==============================================================================

param (
    [string]$ServerHost = "111.228.44.255",
    [int]$ServerPort = 22,
    [string]$ServerUser = "root",
    [string]$DeployPath = "/opt/ribao",
    [int]$PublicPort = 7899
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "🚀 开始执行本地直连京东云一键更新部署流程" -ForegroundColor Green
Write-Host "目标服务器: $ServerUser@$ServerHost:$ServerPort" -ForegroundColor DarkCyan
Write-Host "部署目录  : $DeployPath" -ForegroundColor DarkCyan
Write-Host "公网端口  : $PublicPort" -ForegroundColor DarkCyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查并执行前端生产构建
Write-Host "📦 [步骤 1/4] 编译前端生产资源包 (npm run build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端构建失败，部署已中断。" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 前端资源打包成功！" -ForegroundColor Green
Write-Host ""

# 2. 生成发布归档压缩包
Write-Host "📦 [步骤 2/4] 生成项目部署归档压缩包..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$archiveName = "ribao-direct-$timestamp.tar.gz"
$archivePath = "$PSScriptRoot\$archiveName"

# 临时使用 tar 打包关键目录及文件
tar -czf "$archivePath" -C "$PSScriptRoot" dist server server.js Dockerfile docker-compose.yml package.json package-lock.json
if (-not (Test-Path $archivePath)) {
    Write-Host "❌ 归档压缩包生成失败。" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 部署包生成成功: $archiveName" -ForegroundColor Green
Write-Host ""

# 3. 检查 SSH 连接性
Write-Host "📡 [步骤 3/4] 上传部署包至京东云主机..." -ForegroundColor Yellow
$remoteTmp = "/tmp/$archiveName"

$scpCmd = "scp -P $ServerPort -o StrictHostKeyChecking=no `"$archivePath`" ${ServerUser}@${ServerHost}:$remoteTmp"
Write-Host "正在传输文件，若提示密码请输入服务器密码..." -ForegroundColor Gray
Invoke-Expression $scpCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传失败，请检查网络或密码。" -ForegroundColor Red
    Remove-Item -Path $archivePath -Force -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "✅ 部署包成功上传到服务器: $remoteTmp" -ForegroundColor Green
Write-Host ""

# 4. 远程解压并热重启 Docker 容器
Write-Host "🐳 [步骤 4/4] 远程重构 Docker 容器并启动服务..." -ForegroundColor Yellow

$remoteScript = @"
set -e
echo '>>> 1. 创建并更新目标目录...'
mkdir -p $DeployPath /var/backups
tar -xzf $remoteTmp -C $DeployPath
rm -f $remoteTmp

cd $DeployPath

echo '>>> 2. 停止旧容器并构建启动新容器...'
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose down || true
    docker-compose up -d --build
elif docker compose version >/dev/null 2>&1; then
    docker compose down || true
    docker compose up -d --build
else
    echo '未找到 docker-compose，正在以 docker build 模式启动...'
    docker stop ribao-app ribao-nginx || true
    docker rm ribao-app ribao-nginx || true
    docker build -t ribao:latest .
    docker run -d --name ribao-app -p 3001:3001 -v $DeployPath/db.json:/app/db.json ribao:latest
fi

echo '>>> 3. 等待服务健康检查...'
sleep 3
curl -sI http://127.0.0.1:3001/api/data || true
echo '>>> 部署更新完成！'
"@

$sshCmd = "ssh -p $ServerPort -o StrictHostKeyChecking=no ${ServerUser}@${ServerHost} `"$remoteScript`""
Invoke-Expression $sshCmd

# 清理本地临时压缩包
Remove-Item -Path $archivePath -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "🎉 京东云直连部署更新完成！" -ForegroundColor Green
Write-Host "线上访问地址: http://${ServerHost}:${PublicPort}" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Green
