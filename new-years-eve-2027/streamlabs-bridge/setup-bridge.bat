@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-bridge.ps1"
if errorlevel 1 (
  echo.
  echo Setup did not complete. Review the message above.
  pause
  exit /b 1
)
echo.
echo Setup complete. Use START-BRIDGE.bat to run the bridge.
pause
