@echo off
echo Starting application suite...

:: Start the frontend server
cd C:\Users\treadmill\Documents\treadmill-frontend-v2
start cmd /k "pnpm next start"
echo Waiting for frontend server to initialize...
timeout /t 8

:: Launch the Kiosk shortcut
start "" "C:\Users\treadmill\Desktop\Kiosk.lnk"

echo All applications have been started.