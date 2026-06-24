@echo off
setlocal EnableDelayedExpansion

title EDdys Cleaner - Setup and Launch
color 0B

echo.
echo  ============================================
echo   EDdys Cleaner  -  disk detox launcher
echo  ============================================
echo.

cd /d "%~dp0"

:: --------------------------------------------------
:: 1. Check Node.js
:: --------------------------------------------------
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [SETUP] Node.js not found - attempting automatic install...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -AutoUpgrade
    if !errorlevel! neq 0 (
        echo [ERROR] Node.js is not installed.
        echo.
        echo  Download and install Node.js LTS from:
        echo  https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-node.ps1" -AutoUpgrade
    if !errorlevel! equ 2 (
        echo.
        echo [ERROR] Could not upgrade Node.js automatically.
        echo         Install Node.js 20.19+ from https://nodejs.org/ then rerun start.bat
        pause
        exit /b 1
    )
    if !errorlevel! neq 0 (
        echo [ERROR] Node.js check failed.
        pause
        exit /b 1
    )
)

if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js !NODE_VER! found

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not available. Reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('npm --version') do set NPM_VER=%%v
echo [OK] npm !NPM_VER! found

:: --------------------------------------------------
:: 2. Install Rust if missing
:: --------------------------------------------------
set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
set "PATH=%CARGO_BIN%;%PATH%"

where rustc >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [SETUP] Rust not found. Installing via rustup...
    echo         This may take a few minutes on first run.
    echo.

    set "RUSTUP_INIT=%TEMP%\rustup-init.exe"
    curl -fsSL -o "!RUSTUP_INIT!" https://win.rustup.rs/x86_64
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to download rustup installer.
        echo         Install Rust manually from https://rustup.rs/
        pause
        exit /b 1
    )

    "!RUSTUP_INIT!" -y --default-toolchain stable
    if !errorlevel! neq 0 (
        echo [ERROR] Rust installation failed.
        pause
        exit /b 1
    )

    del "!RUSTUP_INIT!" >nul 2>&1
    set "PATH=%CARGO_BIN%;%PATH%"
)

for /f "tokens=*" %%v in ('rustc --version 2^>nul') do set RUST_VER=%%v
echo [OK] !RUST_VER!

for /f "tokens=*" %%v in ('cargo --version 2^>nul') do set CARGO_VER=%%v
echo [OK] !CARGO_VER!

:: --------------------------------------------------
:: 3. MSVC Build Tools reminder (Rust on Windows)
:: --------------------------------------------------
where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [NOTE] Visual Studio C++ Build Tools not detected in PATH.
    echo        If the build fails, install:
    echo        https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo        Select "Desktop development with C++" workload.
    echo.
)

:: --------------------------------------------------
:: 4. Install npm dependencies
:: --------------------------------------------------
echo.
echo [SETUP] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo [OK] npm dependencies installed

:: --------------------------------------------------
:: 5. Auto-fix npm security advisories (safe fixes only)
:: --------------------------------------------------
echo.
echo [SETUP] Checking npm security advisories...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\ensure-npm-audit.ps1"
if !errorlevel! equ 1 (
    echo [ERROR] npm audit setup failed.
    pause
    exit /b 1
)

:: --------------------------------------------------
:: 6. Build and launch EDdys Cleaner
:: --------------------------------------------------
set "RELEASE_EXE=src-tauri\target\release\allj-cleaner.exe"

echo.
echo [DONE] Setup complete!
echo.
echo  Next time, just double-click:  run.bat
echo  ^(much faster - skips install steps^)
echo.
echo  To rebuild the .exe later:      build.bat
echo  To free disk space ^(cargo clean^): clean.bat
echo.
echo [BUILD] Building EDdys Cleaner...
echo         First compile may take 2-5 minutes. Hang tight.
echo.

call "%~dp0scripts\stop-running-app.bat"
if !errorlevel! neq 0 (
    pause
    exit /b 1
)

call npm run tauri build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed.
    echo         Check errors above. Common fixes:
    echo         - Close EDdys Cleaner if it is still open, then rerun start.bat
    echo         - Install Visual Studio C++ Build Tools
    echo         - Restart terminal after Rust install
    echo         - Run: rustup default stable
    echo.
    pause
    exit /b 1
)

if not exist "%RELEASE_EXE%" (
    echo [ERROR] Build finished but exe was not found:
    echo         %RELEASE_EXE%
    pause
    exit /b 1
)

echo [LAUNCH] Starting EDdys Cleaner...
start "" "%RELEASE_EXE%"
exit /b 0
