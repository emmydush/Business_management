# Build Frontend Script for Business Management System
# Run this AFTER installing Node.js

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Building Frontend - Business Management System" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Go to https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Download and install the LTS version" -ForegroundColor White
    Write-Host "3. Restart PowerShell and run this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if npm is available
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not available!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "This may take 2-5 minutes on first run..." -ForegroundColor Gray
Write-Host ""

Set-Location $PSScriptRoot\frontend

# Install dependencies
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Try running as Administrator or check your internet connection" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Step 2: Building Frontend" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Compiling React application..." -ForegroundColor Gray
Write-Host ""

# Build the frontend
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✓ Build Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your changes are now live!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure backend is running (http://localhost:5000)" -ForegroundColor White
Write-Host "2. Refresh your browser (Ctrl+F5 to clear cache)" -ForegroundColor White
Write-Host "3. Login as superadmin" -ForegroundColor White
Write-Host "4. Go to User Management page" -ForegroundColor White
Write-Host "5. You should see View, Edit, and Delete buttons for all users" -ForegroundColor White
Write-Host ""
Write-Host "Build output location: frontend/build/" -ForegroundColor Gray
Write-Host ""
