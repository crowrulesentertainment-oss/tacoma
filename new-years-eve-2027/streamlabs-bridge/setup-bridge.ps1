$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "CrowRules | Streamlabs Bridge Setup" -ForegroundColor Cyan
Write-Host "Credentials are saved only in this folder's local .env file."
Write-Host "Do not upload or share that file."
Write-Host ""

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js is not installed. Install Node.js 20.11 LTS or newer from https://nodejs.org/en/download, then run setup again." -ForegroundColor Red
  exit 1
}
$nodeVersion = (& node -p "process.versions.node").Trim()
$major = [int]($nodeVersion.Split('.')[0])
$minor = [int]($nodeVersion.Split('.')[1])
if (($major -lt 20) -or (($major -eq 20) -and ($minor -lt 11))) {
  Write-Host "Node.js $nodeVersion found. Version 20.11 or newer is required." -ForegroundColor Red
  exit 1
}
Write-Host "Node.js $nodeVersion detected." -ForegroundColor Green

$bridgeSecure = Read-Host "Paste the one-time Tacoma bridge token" -AsSecureString
$streamlabsSecure = Read-Host "Paste the Streamlabs Settings > Remote Control API token" -AsSecureString
$device = Read-Host "Production computer name (press Enter for default)"
if ([string]::IsNullOrWhiteSpace($device)) { $device = "Streamlabs Desktop Production PC" }
$apiUrl = Read-Host "Streamlabs local API URL (press Enter for default http://127.0.0.1:59650/api)"
if ([string]::IsNullOrWhiteSpace($apiUrl)) { $apiUrl = "http://127.0.0.1:59650/api" }
$parsed = $null
if (-not [Uri]::TryCreate($apiUrl, [UriKind]::Absolute, [ref]$parsed) -or $parsed.Scheme -ne "http" -or $parsed.Host -notin @("127.0.0.1","localhost","[::1]")) {
  Write-Host "Rejected API URL. The Streamlabs API must use local loopback HTTP; do not expose it to the internet." -ForegroundColor Red
  exit 1
}
function Convert-SecureToPlain([Security.SecureString]$value) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}
$bridgeToken = Convert-SecureToPlain $bridgeSecure
$apiToken = Convert-SecureToPlain $streamlabsSecure
if ($bridgeToken.Length -lt 30) { throw "The Tacoma bridge token looks too short. Pair this computer again in Broadcast Studio and retry." }
if ($apiToken.Length -lt 20) { throw "The Streamlabs API token looks too short. Copy it from Streamlabs Settings > Remote Control." }
$escapeEnv = { param($v) '"' + ($v -replace '\\','\\\\' -replace '"','\\"' -replace "`r?`n",' ') + '"' }
$envText = @"
# Private local credentials. Never commit or upload this file.
STREAMLABS_CONTROL_URL=https://cevylpnoexugwgygvtgu.supabase.co/functions/v1/tacoma-obs-control
STREAMLABS_BRIDGE_TOKEN="$bridgeToken"
STREAMLABS_DEVICE_NAME=$(& $escapeEnv $device)
STREAMLABS_API_URL=$apiUrl
STREAMLABS_API_TOKEN="$apiToken"
POLL_INTERVAL_MS=2000
"@
[IO.File]::WriteAllText((Join-Path $PSScriptRoot ".env"), $envText, (New-Object System.Text.UTF8Encoding($false)))
$bridgeToken = $null; $apiToken = $null; $envText = $null
Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed. Check your internet connection and try setup again." }
Write-Host ""
Write-Host "Setup finished. Open Streamlabs Desktop, enable Settings > Remote Control, then run START-BRIDGE.bat." -ForegroundColor Green
Write-Host "Logs will be written to bridge.log and bridge-error.log in this folder."
