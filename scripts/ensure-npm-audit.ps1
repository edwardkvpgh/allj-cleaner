param(
    [switch]$Quiet
)

function Write-Status {
    param([string]$Message)
    if (-not $Quiet) {
        Write-Host $Message
    }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Test-Path "package.json")) {
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Status "[NOTE] node_modules missing - run npm install first"
    exit 0
}

function Get-AuditTotal {
    $output = npm audit --json 2>$null
    if (-not $output) {
        return $null
    }

    try {
        $audit = $output | ConvertFrom-Json
        return [int]$audit.metadata.vulnerabilities.total
    } catch {
        return $null
    }
}

$total = Get-AuditTotal
if ($null -eq $total) {
    Write-Status "[NOTE] Could not read npm audit report - continuing"
    exit 0
}

if ($total -eq 0) {
    Write-Status "[OK] npm dependencies have no known vulnerabilities"
    exit 0
}

Write-Status "[SETUP] npm audit found $total issue(s) - applying safe fixes..."
npm audit fix 2>$null | Out-Null

# Re-apply lockfile overrides (e.g. pinned transitive deps) if advisories remain.
$remaining = Get-AuditTotal
if ($null -ne $remaining -and $remaining -gt 0) {
    npm install 2>$null | Out-Null
    $remaining = Get-AuditTotal
}

if ($null -eq $remaining) {
    Write-Status "[NOTE] npm audit fix finished - could not verify result"
    exit 0
}

if ($remaining -eq 0) {
    Write-Status "[OK] npm audit issues auto-fixed"
    exit 0
}

Write-Status "[NOTE] $remaining npm audit issue(s) remain after safe auto-fix"
Write-Status "       App will still run. Review with: npm audit"
exit 0
