param(
    [ValidateSet("KeepExe", "Full")]
    [string]$Mode = "KeepExe"
)

$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
$target = Join-Path $root "src-tauri\target"
$cargoDir = Join-Path $root "src-tauri"
$releaseDir = Join-Path $target "release"
$releaseExe = Join-Path $releaseDir "allj-cleaner.exe"
$stash = Join-Path $env:TEMP "allj-cleaner-exe-stash"

function Format-Bytes([long]$bytes) {
    if ($bytes -ge 1GB) { return "{0:N2} GB" -f ($bytes / 1GB) }
    if ($bytes -ge 1MB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    if ($bytes -ge 1KB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    return "$bytes bytes"
}

function Get-FolderBytes([string]$path) {
    if (-not (Test-Path $path)) { return [long]0 }
    $sum = (
        Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue |
        Measure-Object -Property Length -Sum
    ).Sum
    if ($null -eq $sum) { return [long]0 }
    return [long]$sum
}

function Invoke-CargoClean {
    Push-Location $cargoDir
    try {
        & cargo clean
        if ($LASTEXITCODE -ne 0) {
            throw "cargo clean failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

function Stash-ReleaseRuntime {
    if (Test-Path $stash) {
        Remove-Item $stash -Recurse -Force
    }
    New-Item -ItemType Directory -Path $stash -Force | Out-Null

    Get-ChildItem $releaseDir -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $stash $_.Name) -Force
    }

    $resources = Join-Path $releaseDir "resources"
    if (Test-Path $resources) {
        Copy-Item $resources (Join-Path $stash "resources") -Recurse -Force
    }
}

function Restore-ReleaseRuntime {
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null

    Get-ChildItem $stash -File -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $releaseDir $_.Name) -Force
    }

    $stashResources = Join-Path $stash "resources"
    if (Test-Path $stashResources) {
        Copy-Item $stashResources (Join-Path $releaseDir "resources") -Recurse -Force
    }
}

function Test-ReleaseRunnable {
    if (-not (Test-Path $releaseExe)) {
        return $false
    }

    $exe = Get-Item $releaseExe
    if ($exe.Length -lt 1MB) {
        return $false
    }

    # Debug/dev binaries are usually copied here by mistake; release builds bundle UI assets.
    $resources = Join-Path $releaseDir "resources"
    if (-not (Test-Path $resources)) {
        return $false
    }

    return $true
}

if (-not (Test-Path $target)) {
    Write-Host "[OK] No target folder found - nothing to clean."
    exit 0
}

$beforeBytes = Get-FolderBytes $target
Write-Host "[INFO] Current build cache: $(Format-Bytes $beforeBytes)"

if ($Mode -eq "Full") {
    Write-Host "[CLEAN] Full delete (cargo clean)..."
    Invoke-CargoClean
    Write-Host "[DONE] Build cache removed. Rebuild with build.bat or run.bat."
    exit 0
}

if (-not (Test-ReleaseRunnable)) {
    $debugExe = Join-Path $target "debug\allj-cleaner.exe"
    Write-Host ""
    Write-Host "[WARN] No runnable RELEASE build to keep."
    Write-Host "        Need: src-tauri\target\release\allj-cleaner.exe + resources\"
    Write-Host ""
    if (Test-Path $debugExe) {
        Write-Host "        You have a DEBUG build (from run.bat dev mode)."
        Write-Host "        Debug opens http://localhost:1420 and cannot run by double-click."
    }
    Write-Host ""
    Write-Host "        Run build.bat first, then clean.bat with K."
    Write-Host "        Or use F for full delete."
    exit 1
}

$exeItem = Get-Item $releaseExe
Write-Host "[KEEP] Release EXE: $($exeItem.FullName)"
Write-Host "       Modified: $($exeItem.LastWriteTime)"
Write-Host "       Includes resources folder for standalone UI."

Stash-ReleaseRuntime

try {
    Write-Host "[CLEAN] Removing build cache (cargo clean)..."
    Invoke-CargoClean
    Restore-ReleaseRuntime
}
finally {
    if (Test-Path $stash) {
        Remove-Item $stash -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$afterBytes = Get-FolderBytes $target
$freedBytes = [Math]::Max([long]0, $beforeBytes - $afterBytes)

Write-Host ""
Write-Host "[DONE] Kept: src-tauri\target\release\ (EXE + DLL + resources)"
Write-Host "       Freed about: $(Format-Bytes $freedBytes)"
Write-Host "       Remaining:   $(Format-Bytes $afterBytes)"
Write-Host ""
Write-Host "       run.bat or double-click allj-cleaner.exe should work."
Write-Host "       Next code change will rebuild the cache (2-5 min once)."

exit 0
