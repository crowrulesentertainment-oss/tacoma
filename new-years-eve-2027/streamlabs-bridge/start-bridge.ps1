$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path (Join-Path $PSScriptRoot ".env"))) {
  Write-Host "Missing .env. Run SETUP-BRIDGE.bat first." -ForegroundColor Red
  exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed or not on PATH." -ForegroundColor Red
  exit 1
}
$pidFile = Join-Path $PSScriptRoot "bridge.pid"
if (Test-Path $pidFile) {
  $oldPid = 0
  [void][int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$oldPid)
  if ($oldPid -gt 0 -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
    Write-Host "CrowRules bridge is already running (PID $oldPid)." -ForegroundColor Yellow
    exit 0
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}
$outLog = Join-Path $PSScriptRoot "bridge.log"
$errLog = Join-Path $PSScriptRoot "bridge-error.log"
$p = Start-Process -FilePath (Get-Command node).Source -ArgumentList @("bridge.js") -WorkingDirectory $PSScriptRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog
Set-Content -Path $pidFile -Value $p.Id -NoNewline
Write-Host "CrowRules Streamlabs Bridge started (PID $($p.Id))." -ForegroundColor Green
Write-Host "Output: $outLog"
Write-Host "Errors: $errLog"
Write-Host "Use STOP-BRIDGE.bat to stop it. Keep Streamlabs Desktop open."
