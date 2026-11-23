$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$pidFile = Join-Path $PSScriptRoot "bridge.pid"
if (-not (Test-Path $pidFile)) {
  Write-Host "No bridge PID file found. The bridge may already be stopped." -ForegroundColor Yellow
  exit 0
}
$bridgePid = 0
[void][int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$bridgePid)
if ($bridgePid -gt 0) {
  $p = Get-Process -Id $bridgePid -ErrorAction SilentlyContinue
  if ($p) {
    if ($p.ProcessName -ne "node") {
      Write-Host "PID file does not point to a Node.js process; refusing to stop it." -ForegroundColor Red
      exit 1
    }
    Stop-Process -Id $bridgePid -Force
    Write-Host "CrowRules bridge stopped." -ForegroundColor Green
  } else {
    Write-Host "Bridge process was already stopped." -ForegroundColor Yellow
  }
}
Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
