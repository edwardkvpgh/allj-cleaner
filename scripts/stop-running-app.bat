@echo off
setlocal

tasklist /FI "IMAGENAME eq allj-cleaner.exe" 2>nul | find /I /C "allj-cleaner.exe" >nul
if %errorlevel% neq 0 exit /b 0

echo [SETUP] Closing running EDdys Cleaner so the build can continue...
taskkill /F /IM allj-cleaner.exe >nul 2>&1

:: Wait for Windows to release the .exe file lock
timeout /t 2 /nobreak >nul

tasklist /FI "IMAGENAME eq allj-cleaner.exe" 2>nul | find /I /C "allj-cleaner.exe" >nul
if %errorlevel% equ 0 (
    echo [WARN] EDdys Cleaner is still running. Close it manually, then try again.
    exit /b 1
)

exit /b 0
