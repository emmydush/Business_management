#!/usr/bin/env pwsh
# Docker Health Check Script
# Verifies that all Docker services are running correctly

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Business Management System - Docker Health Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$allHealthy = $true

# Check Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found or not running" -ForegroundColor Red
    $allHealthy = $false
}

# Check Docker Compose
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose installed: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""
Write-Host "Checking Containers..." -ForegroundColor Yellow

# Check if containers are running
$containers = docker-compose ps --format json 2>$null

if ($containers) {
    $containers | ForEach-Object {
        $container = $_ | ConvertFrom-Json
        $name = $container.Service
        $state = $container.State
        $health = $container.Health
        
        if ($state -eq "running") {
            Write-Host "✓ $name : $state" -ForegroundColor Green
            if ($health) {
                Write-Host "  Health: $health" -ForegroundColor Gray
            }
        } else {
            Write-Host "✗ $name : $state" -ForegroundColor Red
            $allHealthy = $false
        }
    }
} else {
    Write-Host "✗ No containers found or Docker Compose not running" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""
Write-Host "Checking Network Connectivity..." -ForegroundColor Yellow

# Test backend health
Write-Host "Testing Backend API..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend API responding on port 5000" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend API returned status: $($response.StatusCode)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ Backend API not reachable on port 5000" -ForegroundColor Red
    $allHealthy = $false
}

# Test frontend
Write-Host "Testing Frontend..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend responding on port 3000" -ForegroundColor Green
    } else {
        Write-Host "✗ Frontend returned status: $($response.StatusCode)" -ForegroundColor Red
        $allHealthy = $false
    }
} catch {
    Write-Host "✗ Frontend not reachable on port 3000" -ForegroundColor Red
    $allHealthy = $false
}

Write-Host ""
Write-Host "Checking Resource Usage..." -ForegroundColor Yellow
try {
    $stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    Write-Host $stats -ForegroundColor Gray
} catch {
    Write-Host "⚠ Could not retrieve resource stats" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan

if ($allHealthy) {
    Write-Host "✓ All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access points:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host "  Database: localhost:5432" -ForegroundColor White
} else {
    Write-Host "✗ Some issues detected" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  View logs: .\start-docker.ps1 -Logs" -ForegroundColor White
    Write-Host "  Restart:   .\start-docker.ps1 -Restart" -ForegroundColor White
    Write-Host "  Reset:     .\start-docker.ps1 -Stop -Clean" -ForegroundColor White
}

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
