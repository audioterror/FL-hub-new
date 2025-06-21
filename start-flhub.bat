@echo off
echo ===================================
echo =       FL Hub Launcher          =
echo ===================================
echo.
echo Starting FL Hub application...
echo.

:: Проверяем, установлен ли Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js не установлен!
    echo Пожалуйста, установите Node.js с сайта https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Пропускаем проверку PostgreSQL
echo Пропускаем проверку соединения с базой данных...

:: Запускаем бэкенд в отдельном окне
echo Запуск бэкенда...
start "FL Hub Backend" cmd /c "cd backend && npm run dev"

:: Ждем 3 секунды, чтобы бэкенд успел запуститься
timeout /t 3 /nobreak >nul

:: Запускаем фронтенд в отдельном окне
echo Запуск фронтенда...
start "FL Hub Frontend" cmd /c "cd frontend && npm run dev"

:: Открываем браузер с приложением через 5 секунд
echo Открытие приложения в браузере через 5 секунд...
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================
echo =  FL Hub успешно запущен!       =
echo =  Backend: http://localhost:5000 =
echo =  Frontend: http://localhost:5173 =
echo ===================================
echo.
echo Для остановки приложения закройте окна командной строки.
echo.

pause
