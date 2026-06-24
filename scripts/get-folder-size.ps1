$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) {
    [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
} else {
    (Get-Location).Path
}

$path = if ($args.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace($args[0])) {
    $args[0]
} else {
    Join-Path $root "src-tauri\target"
}

if (-not (Test-Path -LiteralPath $path)) {
    Write-Output "0 bytes"
    exit 0
}

$sum = (
    Get-ChildItem -LiteralPath $path -Recurse -File -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum
).Sum

if ($null -eq $sum) { $sum = [long]0 }
$bytes = [long]$sum

if ($bytes -ge 1GB) { Write-Output ("{0:N2} GB" -f ($bytes / 1GB)) }
elseif ($bytes -ge 1MB) { Write-Output ("{0:N2} MB" -f ($bytes / 1MB)) }
elseif ($bytes -ge 1KB) { Write-Output ("{0:N2} KB" -f ($bytes / 1KB)) }
else { Write-Output ("{0:N0} bytes" -f $bytes) }

exit 0
