@echo off
echo ===================================
echo =       FL Hub Stopper           =
echo ===================================
echo.
echo Останавливаем FL Hub приложение...
echo.

:: Находим и останавливаем процессы Node.js, связанные с нашим приложением
echo Останавливаем процессы Node.js...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list ^| find "PID:"') do (
    wmic process where "ProcessId=%%a" get CommandLine | find "backend" > nul
    if not errorlevel 1 (
        echo Останавливаем бэкенд (PID: %%a)...
        taskkill /PID %%a /F
    )
    
    wmic process where "ProcessId=%%a" get CommandLine | find "frontend" > nul
    if not errorlevel 1 (
        echo Останавливаем фронтенд (PID: %%a)...
        taskkill /PID %%a /F
    )
)

echo.
echo ===================================
echo =  FL Hub успешно остановлен!    =
echo ===================================
echo.

pause
