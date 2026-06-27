@echo off
setlocal EnableDelayedExpansion
title Detox - Free disk space
color 0E

cd /d "%~dp0"

set "CARGO_BIN=%USERPROFILE%\.cargo\bin"
set "PATH=%CARGO_BIN%;%PATH%"
set "TARGET_DIR=src-tauri\target"
set "RELEASE_EXE=src-tauri\target\release\allj-cleaner.exe"

echo.
echo  ============================================
echo   Detox  -  free disk space
echo  ============================================
echo.
echo  Build cache folder:
echo    %TARGET_DIR%
echo.
echo  Typical size: several GB ^(debug + release + compiler cache^).
echo  Your source code is NOT deleted.
echo.

if not exist "%TARGET_DIR%" (
    echo [OK] No target folder found - nothing to clean.
    echo.
    pause
    exit /b 0
)

set "RELEASE_RESOURCES=src-tauri\target\release\resources"
set "DEBUG_EXE=src-tauri\target\debug\allj-cleaner.exe"
set "HAS_RELEASE=0"
if exist "%RELEASE_EXE%" if exist "%RELEASE_RESOURCES%" set "HAS_RELEASE=1"

for /f "usebackq delims=" %%S in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\get-folder-size.ps1"`) do set "TARGET_SIZE=%%S"

echo  Current size: !TARGET_SIZE!
if "!HAS_RELEASE!"=="1" (
    echo  Release EXE:  ready ^(EXE + resources - run.bat works^)
) else if exist "%RELEASE_EXE%" (
    echo  Release EXE:  incomplete ^(missing resources - run build.bat^)
) else if exist "%DEBUG_EXE%" (
    echo  Release EXE:  not found - only DEBUG dev cache ^(run.bat dev mode^)
) else (
    echo  Release EXE:  not found ^(run build.bat or run.bat^)
)
echo.
if "!HAS_RELEASE!"=="0" (
    echo  NOTE: K ^(keep EXE^) needs build.bat first ^(release + resources^).
    if exist "%DEBUG_EXE%" (
        echo        You have debug cache only - it cannot be kept as a standalone app.
    )
    echo        To free !TARGET_SIZE! now, use F ^(full delete^).
    echo.
)
echo  K = Keep release EXE + UI files, clean the rest ^(recommended after build.bat^)
echo  F = Full delete everything ^(frees all cache space^)
echo.

set "CLEAN_MODE=KeepExe"
set /p "CLEAN_INPUT=  [K]eep EXE or [F]ull delete ^(Enter=K^): "
if /I "!CLEAN_INPUT!"=="F" set "CLEAN_MODE=Full"

if /I "!CLEAN_MODE!"=="KeepExe" if "!HAS_RELEASE!"=="0" (
    echo.
    echo  Cannot use K - no standalone release build to keep.
    echo.
    set /p "FALLBACK=  Run FULL delete to free !TARGET_SIZE! instead? ^(Enter=Y^): "
    if /I "!FALLBACK!"=="N" (
        echo.
        echo  Cancelled. Run build.bat first, then clean.bat with K.
        pause
        exit /b 0
    )
    set "CLEAN_MODE=Full"
)

echo.
if /I "!CLEAN_MODE!"=="KeepExe" (
    echo  Selected: K - keep release EXE + resources, clean the rest
) else (
    echo  Selected: F - full delete everything
)

echo.
call "%~dp0scripts\stop-running-app.bat"
if !errorlevel! neq 0 (
    pause
    exit /b 1
)

where cargo >nul 2>&1
if %errorlevel% neq 0 (
    if /I "!CLEAN_MODE!"=="Full" (
        echo.
        echo [WARN] cargo not in PATH - removing target folder directly...
        rmdir /s /q "%TARGET_DIR%" 2>nul
        if exist "%TARGET_DIR%" (
            echo [ERROR] Could not remove target. Close Detox and dev terminals.
            pause
            exit /b 1
        )
        goto done
    )
    echo.
    echo [ERROR] cargo is required to keep the EXE safely.
    echo         Install Rust, or choose Full delete ^(F^), or delete target manually.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\prune-build-cache.ps1" -Mode !CLEAN_MODE!
set "PRUNE_ERR=!errorlevel!"
if !PRUNE_ERR! equ 1 (
    echo.
    echo [WARN] No release build to keep.
    if /I not "!CLEAN_MODE!"=="Full" (
        set /p "FALLBACK=  Run FULL delete instead? ^(Enter=Y^): "
        if /I not "!FALLBACK!"=="N" (
            powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\prune-build-cache.ps1" -Mode Full
            set "PRUNE_ERR=!errorlevel!"
        )
    )
)
if !PRUNE_ERR! neq 0 (
    echo.
    echo [ERROR] Clean could not finish. Close Detox and try again.
    pause
    exit /b 1
)

:done
echo.
echo  Next steps:
echo    - run.bat     launch ^(EXE kept if you chose K^)
echo    - build.bat   full release rebuild + installer
echo    - start.bat   only if setting up a new machine
echo.
pause
exit /b 0
