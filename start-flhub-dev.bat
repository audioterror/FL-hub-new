@echo off
echo Starting FL Hub in development mode...

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
timeout /t 5 /nobreak > nul

REM Запустить Electron в режиме разработки
echo Starting Electron in development mode...
start cmd /k "set NODE_ENV=development && npx electron ."

echo FL Hub started successfully in development mode!
