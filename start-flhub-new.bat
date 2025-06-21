@echo off
echo Starting FL Hub...

REM Остановить все процессы Node.js
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul

REM Подождать немного, чтобы процессы успели завершиться
timeout /t 2 /nobreak > nul

REM Запустить бэкенд
echo Starting backend server...
start cmd /k "cd backend && npm run dev"

REM Подождать, чтобы бэкенд успел запуститься
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Запустить фронтенд
echo Starting frontend...
start cmd /k "cd frontend && npm run dev"

REM Подождать, чтобы фронтенд успел запуститься
echo Waiting for frontend to start...
timeout /t 10 /nobreak > nul

REM Запустить Electron
echo Starting Electron...
set NODE_ENV=development
echo Waiting for frontend to be available on port 5173...
curl --retry 10 --retry-delay 1 --retry-connrefused http://localhost:5173 > nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Frontend is available, starting Electron...
  start cmd /k "electron ."
) else (
  echo Frontend is not available, please check if it's running on port 5173
)

echo FL Hub started successfully!
