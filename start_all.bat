@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo   Movie Madders Development Starter
echo ==========================================

echo.
echo Clearing ports 3000 and 8000...
call clear_ports.bat

echo.
echo [1/2] Starting Backend Server...
if exist "backend\start.bat" (
    start "Movie Madders Backend" cmd /k "cd backend && start.bat"
) else (
    echo [ERROR] backend\start.bat not found!
    pause
    exit /b 1
)

echo.
echo [2/2] Starting Frontend Server...
cd frontend

IF NOT EXIST "node_modules" (
    echo Node modules not found. Installing dependencies...
    call bun install
)

echo.
echo Starting Next.js Dev Server...
echo Access the app at http://localhost:3000
call bun run dev
