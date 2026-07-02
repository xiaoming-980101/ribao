@echo off
title Winner Daily Launcher
echo ===================================================
echo           Winner Daily (Ying Ri Bao) Launcher
echo ===================================================
echo.

rem Check node_modules
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    echo [INFO] This might take a minute, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b %errorlevel%
    )
    echo [SUCCESS] Dependencies installed!
    echo.
)

rem Start backend server (Port 3001)
echo [1/3] Starting backend database server (Port: 3001)...
start "Winner Daily Server" /min cmd /c "npm run server"

rem Start frontend Vite dev server (Port 3000)
echo [2/3] Starting frontend server (Port: 3000)...
start "Winner Daily Frontend" /min cmd /c "npm run dev"

rem Wait 3 seconds and open browser
echo [3/3] Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ===================================================
echo [SUCCESS] Winner Daily is running!
echo.
echo - Frontend: http://localhost:3000
echo - Database: d:\app\ribao\db.json
echo ===================================================
echo.
pause
