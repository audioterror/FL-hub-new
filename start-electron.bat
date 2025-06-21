@echo off
echo Starting Electron application...

REM Остановить все процессы Node.js и Electron
echo Stopping any running Node.js and Electron processes...
taskkill /F /IM node.exe /T 2>nul
taskkill /F /IM electron.exe /T 2>nul

REM Подождать немного, чтобы процессы успели завершиться
timeout /t 2 /nobreak > nul

REM Установить переменную окружения NODE_ENV
set NODE_ENV=development

REM Запустить Electron
echo Starting Electron...
electron .
