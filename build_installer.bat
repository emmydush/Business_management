@echo off
echo Building Business Management System Installer...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the frontend directory.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Build the React app
echo Building React application...
npm run build

REM Create Electron installer
echo Creating Electron installer...
npm run electron-pack

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo Installer location: frontend\dist\
echo.
echo The installer has been created with your custom logo icon.
echo You can now distribute the BusinessManagementSystem Setup.exe file.
echo.
pause
