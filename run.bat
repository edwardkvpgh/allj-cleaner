@echo off
setlocal EnableDelayedExpansion
title EDdys Cleaner
cd /d "%~dp0"

set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
set "PATH=%CARGO_BIN%;%PATH%"

:: If already running, ask before launching another copy
tasklist /FI "IMAGENAME eq allj-cleaner.exe" 2>nul | find /I "allj-cleaner.exe" >nul
if %errorlevel% equ 0 (
    echo.
    echo EDdys Cleaner is already running.
    choice /C YN /M "Close the other window and start a fresh one"
    if errorlevel 2 exit /b 0
    taskkill /F /IM allj-cleaner.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
)

set "RELEASE_EXE=src-tauri\target\release\allj-cleaner.exe"

where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%RELEASE_EXE%" (
        echo Starting EDdys Cleaner...
        start "" "%RELEASE_EXE%"
        exit /b 0
    )
    echo Node.js not found. Run start.bat first for full setup.
    pause
    exit /b 1
)

:: Ensure Node meets Vite minimum before any npm build/dev step
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -AutoUpgrade >nul 2>&1
if !errorlevel! equ 2 (
    echo.
    echo Node.js is too old for Vite ^(needs 20.19+ or 22.12+^).
    echo Run start.bat once to auto-upgrade, or install from https://nodejs.org/
    echo.
    if exist "%RELEASE_EXE%" (
        echo Starting existing build without rebuild...
        start "" "%RELEASE_EXE%"
        exit /b 0
    )
    pause
    exit /b 1
)

if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

:: Rebuild release when source code is newer than the .exe
if exist "%RELEASE_EXE%" (
    set "STALE=0"
    for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command ^
        "$exe=Get-Item '%RELEASE_EXE%'; $stale=$false; foreach($root in @('src','src-tauri\src')){ if(Test-Path $root){ Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $exe.LastWriteTime } | Select-Object -First 1 | ForEach-Object { $stale=$true } } }; if($stale){'1'}else{'0'}"`) do set STALE=%%I

    if "!STALE!"=="1" (
        echo.
        echo Code changed since last build - rebuilding EDdys Cleaner...
        echo This takes a few minutes. One-time wait for latest fixes.
        echo.
        call "%~dp0scripts\stop-running-app.bat"
        if !errorlevel! neq 0 (
            echo.
            echo Close EDdys Cleaner manually, then run run.bat again.
            pause
            exit /b 1
        )
        powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-npm-audit.ps1" -Quiet
        call npm run tauri build
        if !errorlevel! neq 0 (
            echo.
            echo Build failed. Starting dev mode instead...
            goto dev_mode
        )
    )

    echo Starting EDdys Cleaner...
    start "" "%RELEASE_EXE%"
    exit /b 0
)

:dev_mode
echo Starting EDdys Cleaner ^(dev mode^)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-npm-audit.ps1" -Quiet
call npm run tauri dev

if %errorlevel% neq 0 pause
