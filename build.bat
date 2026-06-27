@echo off
title Detox - Build
cd /d "%~dp0"

set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
set "PATH=%CARGO_BIN%;%PATH%"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Run start.bat first to install dependencies.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -AutoUpgrade
if %errorlevel% equ 2 (
    echo.
    echo Node.js is too old for Vite ^(needs 20.19+ or 22.12+^).
    echo Run start.bat to auto-upgrade, or install from https://nodejs.org/
    pause
    exit /b 1
)
if %errorlevel% neq 0 (
    echo Node.js check failed.
    pause
    exit /b 1
)

if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo.
echo Building Detox standalone app...
echo This takes a few minutes the first time.
echo.

call "%~dp0scripts\stop-running-app.bat"
if %errorlevel% neq 0 (
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-npm-audit.ps1" -Quiet
call npm run tauri build

if %errorlevel% neq 0 (
    echo.
    echo Build failed. Close Detox if it is open, then try again.
    pause
    exit /b 1
)

echo.
echo Done! You can now use run.bat or open:
echo   src-tauri\target\release\allj-cleaner.exe
echo.
echo Installer ^(optional^):
echo   src-tauri\target\release\bundle\
echo.
pause
