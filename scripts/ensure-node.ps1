param(
    [switch]$AutoUpgrade
)

function Test-NodeVersion {
    param([string]$VersionText)

    $v = $VersionText.Trim().TrimStart("v")
    $parts = $v.Split(".")
    if ($parts.Count -lt 2) {
        return $false
    }

    $major = [int]$parts[0]
    $minor = [int]$parts[1]

    if ($major -gt 22) { return $true }
    if ($major -eq 22 -and $minor -ge 12) { return $true }
    if ($major -eq 20 -and $minor -ge 19) { return $true }
    return $false
}

function Refresh-NodePath {
    $nodePaths = @(
        "$env:ProgramFiles\nodejs",
        "${env:ProgramFiles(x86)}\nodejs",
        "$env:LOCALAPPDATA\Programs\nodejs"
    )

    foreach ($path in $nodePaths) {
        if (Test-Path $path) {
            $env:PATH = "$path;$env:PATH"
        }
    }
}

function Install-NodeLts {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        Write-Host "[ERROR] winget is not available."
        Write-Host "        Install Node.js 20.19+ manually from https://nodejs.org/"
        return $false
    }

    Write-Host "[SETUP] Installing/upgrading Node.js LTS via winget..."
    & winget upgrade --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent 2>$null
    if ($LASTEXITCODE -ne 0) {
        & winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
    }

    Refresh-NodePath
    return $true
}

Refresh-NodePath

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    if (-not $AutoUpgrade) {
        exit 1
    }

    if (-not (Install-NodeLts)) {
        exit 1
    }
}

$version = (node --version 2>$null)
if (-not $version) {
    exit 1
}

if (Test-NodeVersion $version) {
    Write-Host "[OK] Node.js $version meets Vite requirements"
    exit 0
}

Write-Host "[WARN] Node.js $version is below Vite minimum (20.19+ or 22.12+)"

if (-not $AutoUpgrade) {
    exit 2
}

if (-not (Install-NodeLts)) {
    exit 2
}

$version = (node --version 2>$null)
if ($version -and (Test-NodeVersion $version)) {
    Write-Host "[OK] Node.js upgraded to $version"
    exit 0
}

Write-Host "[ERROR] Node.js is still too old after upgrade."
Write-Host "        Close this window, reopen it, and run start.bat again."
Write-Host "        Or install manually from https://nodejs.org/"
exit 2
