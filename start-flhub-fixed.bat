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

REM Запустить фронтенд и Electron
echo Starting frontend and Electron...
npm run dev

echo FL Hub started successfully!
