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
set "RELEASE_RESOURCES=src-tauri\target\release\resources"

where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%RELEASE_EXE%" if exist "%RELEASE_RESOURCES%" (
        echo Starting EDdys Cleaner...
        start "" "%RELEASE_EXE%"
        exit /b 0
    )
    if exist "%RELEASE_EXE%" (
        echo.
        echo Release build is incomplete ^(missing UI bundle^).
        echo Install Node.js and run build.bat, or run start.bat for full setup.
        pause
        exit /b 1
    )
    echo Node.js not found. Run start.bat first for full setup.
    pause
    exit /b 1
)

:: Ensure Node meets Vite minimum before any npm build step
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -AutoUpgrade >nul 2>&1
if !errorlevel! equ 2 (
    echo.
    echo Node.js is too old for Vite ^(needs 20.19+ or 22.12+^).
    echo Run start.bat once to auto-upgrade, or install from https://nodejs.org/
    echo.
    if exist "%RELEASE_EXE%" if exist "%RELEASE_RESOURCES%" (
        echo Starting existing build without rebuild...
        start "" "%RELEASE_EXE%"
        exit /b 0
    )
    if exist "%RELEASE_EXE%" (
        echo.
        echo Release build is incomplete ^(missing UI bundle^).
        echo Run build.bat after upgrading Node.js.
        pause
        exit /b 1
    )
    pause
    exit /b 1
)

if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

:: Build or rebuild release when missing, incomplete, or source changed
set "DO_BUILD=0"
if not exist "%RELEASE_EXE%" set "DO_BUILD=1"
if not exist "%RELEASE_RESOURCES%" set "DO_BUILD=1"

if "!DO_BUILD!"=="0" (
    set "STALE=0"
    for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command ^
        "$exe=Get-Item '%RELEASE_EXE%'; $stale=$false; foreach($root in @('src','src-tauri\src')){ if(Test-Path $root){ Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $exe.LastWriteTime } | Select-Object -First 1 | ForEach-Object { $stale=$true } } }; if($stale){'1'}else{'0'}"`) do set STALE=%%I
    if "!STALE!"=="1" set "DO_BUILD=1"
)

if "!DO_BUILD!"=="1" (
    echo.
    if not exist "%RELEASE_EXE%" (
        echo No standalone app yet - building release...
        echo First time takes a few minutes ^(Rust + UI bundle^).
    ) else if not exist "%RELEASE_RESOURCES%" (
        echo Incomplete release build ^(missing resources folder^).
        echo Rebuilding standalone app...
    ) else (
        echo Code changed since last build - rebuilding EDdys Cleaner...
    )
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
        echo Build failed. Try build.bat, or run: npm run tauri dev
        pause
        exit /b 1
    )
)

if not exist "%RELEASE_EXE%" (
    echo.
    echo Release EXE was not created. Run build.bat and check errors above.
    pause
    exit /b 1
)

if not exist "%RELEASE_RESOURCES%" (
    echo.
    echo Release build is still missing the UI bundle ^(resources folder^).
    echo Run build.bat and check for errors.
    pause
    exit /b 1
)

echo Starting EDdys Cleaner...
start "" "%RELEASE_EXE%"
exit /b 0
