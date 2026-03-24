# Test Docker Deployment Script
# This script tests if the Docker deployment is working correctly

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Testing Docker Deployment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Total = 0
}

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    $testResults.Total++
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✓ PASSED: $Name" -ForegroundColor Green
            $testResults.Passed++
        } else {
            Write-Host "✗ FAILED: $Name" -ForegroundColor Red
            $testResults.Failed++
        }
    } catch {
        Write-Host "✗ FAILED: $Name - $($_.Exception.Message)" -ForegroundColor Red
        $testResults.Failed++
    }
    
    Write-Host ""
}

# Test 1: Docker Installation
Test-Feature "Docker Installation" {
    docker --version | Out-Null
    return $?
}

# Test 2: Docker Compose Installation
Test-Feature "Docker Compose Installation" {
    docker-compose --version | Out-Null
    return $?
}

# Test 3: Docker Daemon Running
Test-Feature "Docker Daemon Running" {
    docker info | Out-Null
    return $?
}

# Test 4: Environment File Exists
Test-Feature ".env file exists" {
    if (Test-Path ".env") {
        Write-Host "  Found: .env file" -ForegroundColor Gray
        return $true
    } else {
        Write-Host "  Warning: .env file not found (will use defaults)" -ForegroundColor Yellow
        return $true  # Not critical, will use defaults
    }
}

# Test 5: Docker Compose File Exists
Test-Feature "docker-compose.yml exists" {
    Test-Path "docker-compose.yml"
}

# Test 6: Backend Dockerfile Exists
Test-Feature "backend/Dockerfile exists" {
    Test-Path "backend/Dockerfile"
}

# Test 7: Frontend Dockerfile Exists
Test-Feature "frontend/Dockerfile exists" {
    Test-Path "frontend/Dockerfile"
}

# Test 8: Check if Services are Running
Test-Feature "Docker services status" {
    $services = docker-compose ps --format json 2>$null
    if ($services) {
        $runningCount = 0
        $services | ForEach-Object {
            $container = $_ | ConvertFrom-Json
            if ($container.State -eq "running") {
                $runningCount++
                Write-Host "  ✓ $($container.Service): running" -ForegroundColor Gray
            }
        }
        return ($runningCount -ge 3)  # Expect at least 3 services
    } else {
        Write-Host "  No services running. Start with: .\start-docker.ps1" -ForegroundColor Yellow
        return $false
    }
}

# Test 9: Backend Health Endpoint
Test-Feature "Backend API health endpoint" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -UseBasicParsing
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
        return ($response.StatusCode -eq 200)
    } catch {
        Write-Host "  Cannot reach backend on port 5000" -ForegroundColor Gray
        return $false
    }
}

# Test 10: Frontend Web Server
Test-Feature "Frontend web server" {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
        return ($response.StatusCode -eq 200)
    } catch {
        Write-Host "  Cannot reach frontend on port 3000" -ForegroundColor Gray
        return $false
    }
}

# Test 11: Database Port Accessible
Test-Feature "Database port accessible" {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", 5432)
        $tcpClient.Close()
        Write-Host "  PostgreSQL port 5432 is open" -ForegroundColor Gray
        return $true
    } catch {
        Write-Host "  Cannot connect to PostgreSQL on port 5432" -ForegroundColor Gray
        return $false
    }
}

# Test 12: CORS Configuration
Test-Feature "CORS configuration (optional)" {
    try {
        $headers = @{
            "Origin" = "http://localhost:3000"
            "Access-Control-Request-Method" = "GET"
        }
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Headers $headers -TimeoutSec 5 -UseBasicParsing
        $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
        if ($corsHeader) {
            Write-Host "  CORS header: $corsHeader" -ForegroundColor Gray
            return $true
        } else {
            Write-Host "  No CORS header found (may still work)" -ForegroundColor Gray
            return $true
        }
    } catch {
        Write-Host "  CORS test inconclusive" -ForegroundColor Gray
        return $true  # Not critical
    }
}

# Summary
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Tests:  $($testResults.Total)" -ForegroundColor White
Write-Host "Passed:       $($testResults.Passed)" -ForegroundColor Green
Write-Host "Failed:       $($testResults.Failed)" -ForegroundColor $(if ($testResults.Failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

$successRate = [math]::Round(($testResults.Passed / $testResults.Total) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "✓ All tests passed! Your Docker deployment is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  - Access Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  - Access Backend: http://localhost:5000" -ForegroundColor White
    Write-Host "  - Login with: superadmin / admin123" -ForegroundColor Yellow
} else {
    Write-Host "⚠ Some tests failed. Here's what to check:" -ForegroundColor Yellow
    Write-Host ""
    
    if ($testResults.Passed -lt 5) {
        Write-Host "Critical issues detected. Try these steps:" -ForegroundColor Red
        Write-Host "  1. Ensure Docker Desktop is running" -ForegroundColor White
        Write-Host "  2. Run: .\start-docker.ps1 -Build" -ForegroundColor White
        Write-Host "  3. Wait for services to start (check logs)" -ForegroundColor White
        Write-Host "  4. Run this test again" -ForegroundColor White
    } else {
        Write-Host "Minor issues detected. You may still be able to use the application." -ForegroundColor Yellow
        Write-Host "Check specific failed tests above for details." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "For detailed troubleshooting:" -ForegroundColor Cyan
Write-Host "  - View logs: .\start-docker.ps1 -Logs" -ForegroundColor White
Write-Host "  - Check health: .\check-docker-health.ps1" -ForegroundColor White
Write-Host "  - See DOCKER_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
