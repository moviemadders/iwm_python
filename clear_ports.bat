@echo off
REM Kill processes on ports 3000 and 8000 to ensure clean start

echo Checking for processes on ports 3000 and 8000...

REM Kill process on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process on port 3000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill process on port 8000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process on port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo Ports cleared. Ready to start servers.
timeout /t 2 /nobreak >nul
