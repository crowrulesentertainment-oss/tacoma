@echo off
cd /d "%~dp0"
if not exist .env (
  echo Missing .env file. Copy .env.example to .env and add your local credentials.
  pause
  exit /b 1
)
npm start
pause
