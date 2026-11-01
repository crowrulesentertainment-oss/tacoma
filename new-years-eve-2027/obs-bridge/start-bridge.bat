@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing bridge dependencies...
  npm install
)
echo Starting CrowRules Tacoma OBS Bridge...
npm start
pause
