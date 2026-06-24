# Returns 0 if release build is runnable, 1 if no EXE, 2 if incomplete.
$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptDir) -and $MyInvocation.MyCommand.Path) {
    $scriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
}

$root = [System.IO.Path]::GetFullPath((Join-Path $scriptDir ".."))
$releaseExe = [System.IO.Path]::Combine($root, "src-tauri", "target", "release", "allj-cleaner.exe")
$resourcesDir = [System.IO.Path]::Combine($root, "src-tauri", "target", "release", "resources")

if (-not (Test-Path -LiteralPath $releaseExe)) {
    exit 1
}

if (-not (Test-Path -LiteralPath $resourcesDir)) {
    exit 2
}

$hasUi = Get-ChildItem -LiteralPath $resourcesDir -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -eq "index.html" } |
    Select-Object -First 1

if (-not $hasUi) {
    exit 2
}

exit 0
