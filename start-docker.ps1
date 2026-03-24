# Docker Startup Script for Business Management System
# This script automates the Docker deployment process

param(
    [switch]$Build,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Logs,
    [switch]$Clean,
    [switch]$Help
)

$ComposeFile = "docker-compose.yml"
$EnvFile = ".env"
$EnvTemplate = ".env.docker"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host $Text -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Docker {
    try {
        $dockerVersion = docker --version
        Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
        return $false
    }
}

function Initialize-Environment {
    Write-Header "Initializing Environment"
    
    if (-not (Test-Path $EnvFile)) {
        Write-Host "Creating .env file from template..." -ForegroundColor Yellow
        Copy-Item $EnvTemplate $EnvFile
        Write-Host "✓ Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: Edit .env file and update:" -ForegroundColor Yellow
        Write-Host "  - SECRET_KEY (generate a random key)" -ForegroundColor Yellow
        Write-Host "  - JWT_SECRET_KEY (generate a random key)" -ForegroundColor Yellow
        Write-Host "  - DB_PASSWORD (use a strong password)" -ForegroundColor Yellow
        Write-Host ""
        
        $continue = Read-Host "Have you updated the .env file? (y/n)"
        if ($continue -ne 'y') {
            Write-Host "Please update .env file before continuing" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✓ .env file found" -ForegroundColor Green
    }
}

function Start-Services {
    param([switch]$Rebuild)
    
    Write-Header "Starting Business Management System"
    
    if (-not (Test-Docker)) {
        exit 1
    }
    
    Initialize-Environment
    
    if ($Rebuild) {
        Write-Host "Building Docker images (this may take a few minutes)..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile up --build --force-recreate
    } else {
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile up -d
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access the application:" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
        Write-Host "  Database: localhost:5432" -ForegroundColor White
        Write-Host ""
        Write-Host "Default credentials:" -ForegroundColor Yellow
        Write-Host "  Username: superadmin" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
        Write-Host ""
        Write-Host "View logs with: docker-compose logs -f" -ForegroundColor Gray
        Write-Host "Stop services with: .\start-docker.ps1 -Stop" -ForegroundColor Gray
    } else {
        Write-Host "✗ Failed to start services" -ForegroundColor Red
        Write-Host "Check logs with: docker-compose logs" -ForegroundColor Gray
    }
}

function Stop-Services {
    Write-Header "Stopping Services"
    
    if ($Clean) {
        Write-Host "Stopping and removing all containers and volumes..." -ForegroundColor Yellow
        Write-Host "WARNING: This will delete all data!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (y/n)"
        if ($confirm -eq 'y') {
            docker-compose -f $ComposeFile down -v
        }
    } else {
        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile down
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services stopped" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to stop services" -ForegroundColor Red
    }
}

function Show-Logs {
    Write-Header "Viewing Logs"
    
    $service = Read-Host "Which service? (all/backend/frontend/db, press Enter for all)"
    
    if ([string]::IsNullOrWhiteSpace($service)) {
        $service = "all"
    }
    
    switch ($service) {
        "backend" { docker-compose -f $ComposeFile logs -f backend }
        "frontend" { docker-compose -f $ComposeFile logs -f frontend }
        "db" { docker-compose -f $ComposeFile logs -f db }
        default { docker-compose -f $ComposeFile logs -f }
    }
}

function Show-Status {
    Write-Header "Service Status"
    
    Write-Host "Containers:" -ForegroundColor Cyan
    docker-compose -f $ComposeFile ps
    
    Write-Host ""
    Write-Host "Resource Usage:" -ForegroundColor Cyan
    docker stats --no-stream
}

function Show-Help {
    Write-Header "Business Management System - Docker Help"
    
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\start-docker.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Build    Build and start all services (default)" -ForegroundColor White
    Write-Host "  -Stop     Stop all services" -ForegroundColor White
    Write-Host "  -Restart  Restart all services" -ForegroundColor White
    Write-Host "  -Logs     View logs interactively" -ForegroundColor White
    Write-Host "  -Clean    Remove all containers and volumes (use with -Stop)" -ForegroundColor White
    Write-Host "  -Help     Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\start-docker.ps1 -Build          # Start services" -ForegroundColor White
    Write-Host "  .\start-docker.ps1 -Stop           # Stop services" -ForegroundColor White
    Write-Host "  .\start-docker.ps1 -Stop -Clean    # Stop and remove everything" -ForegroundColor White
    Write-Host "  .\start-docker.ps1 -Logs           # View logs" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual Commands:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d              # Start in background" -ForegroundColor White
    Write-Host "  docker-compose down               # Stop services" -ForegroundColor White
    Write-Host "  docker-compose logs -f            # View logs" -ForegroundColor White
    Write-Host "  docker-compose ps                 # Check status" -ForegroundColor White
    Write-Host "  docker-compose restart backend    # Restart specific service" -ForegroundColor White
    Write-Host ""
}

# Main execution
if ($Help) {
    Show-Help
} elseif ($Stop) {
    Stop-Services -Clean:$Clean
} elseif ($Restart) {
    Stop-Services
    Start-Services -Rebuild:$Build
} elseif ($Logs) {
    Show-Logs
} else {
    Start-Services -Rebuild:$Build
}
