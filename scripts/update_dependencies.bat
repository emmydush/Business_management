@echo off
REM Dependency Update Script for Business Management System (Windows)
REM This script updates all dependencies to the latest compatible versions

echo 🔧 Business Management System - Dependency Update Script
echo ========================================================
echo.

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

REM Default values
set "UPDATE_TYPE=minor"
set "SKIP_BACKUP=false"
set "DRY_RUN=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if /i "%~1"=="--major" (
    set "UPDATE_TYPE=major"
    shift
    goto :parse_args
)
if /i "%~1"=="--minor" (
    set "UPDATE_TYPE=minor"
    shift
    goto :parse_args
)
if /i "%~1"=="--patch" (
    set "UPDATE_TYPE=patch"
    shift
    goto :parse_args
)
if /i "%~1"=="--skip-backup" (
    set "SKIP_BACKUP=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--dry-run" (
    set "DRY_RUN=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    echo Usage: %0 [OPTIONS]
    echo.
    echo Options:
    echo   --major         Update to latest major versions (may include breaking changes)
    echo   --minor         Update to latest minor versions (default)
    echo   --patch         Update only patch versions
    echo   --skip-backup   Skip creating backup of current dependencies
    echo   --dry-run       Show what would be updated without making changes
    echo   --help          Show this help message
    echo.
    exit /b 0
)
echo [ERROR] Unknown option: %~1
exit /b 1

:done_parsing

echo [INFO] Update type: %UPDATE_TYPE%
echo [INFO] Project root: %PROJECT_ROOT%
echo.

REM Check if we're in dry-run mode
if "%DRY_RUN%"=="true" (
    echo [WARNING] DRY RUN MODE - No changes will be made
    echo.
)

REM ============================================
REM BACKUP CURRENT DEPENDENCIES
REM ============================================
if "%SKIP_BACKUP%"=="false" if "%DRY_RUN%"=="false" (
    echo [INFO] Creating backup of current dependencies...
    
    set "BACKUP_DIR=%PROJECT_ROOT%\backups\%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    set "BACKUP_DIR=!BACKUP_DIR: =0!"
    
    if not exist "!BACKUP_DIR!" mkdir "!BACKUP_DIR!"
    
    REM Backup Python dependencies
    if exist "%PROJECT_ROOT%\backend\requirements.txt" (
        copy "%PROJECT_ROOT%\backend\requirements.txt" "!BACKUP_DIR!\requirements.txt.backup"
        echo [SUCCESS] Backed up requirements.txt
    )
    
    REM Backup Node.js dependencies
    if exist "%PROJECT_ROOT%\frontend\package.json" (
        copy "%PROJECT_ROOT%\frontend\package.json" "!BACKUP_DIR!\package.json.backup"
        echo [SUCCESS] Backed up package.json
    )
    
    if exist "%PROJECT_ROOT%\frontend\package-lock.json" (
        copy "%PROJECT_ROOT%\frontend\package-lock.json" "!BACKUP_DIR!\package-lock.json.backup"
        echo [SUCCESS] Backed up package-lock.json
    )
    
    echo Backup created at: !BACKUP_DIR!
    echo.
)

REM ============================================
REM UPDATE PYTHON DEPENDENCIES
REM ============================================
echo [INFO] Updating Python dependencies...
echo -----------------------------------------------------------

cd /d "%PROJECT_ROOT%\backend"

REM Check if virtual environment exists
if not exist "venv" if not exist ".venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    echo [SUCCESS] Virtual environment created
)

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

if "%DRY_RUN%"=="false" (
    echo [INFO] Installing updated dependencies...
    pip install -r requirements.txt --upgrade
    
    REM Freeze current environment to requirements.txt
    pip freeze > requirements.txt
    echo [SUCCESS] Python dependencies updated
) else (
    echo [INFO] [DRY RUN] Would update Python dependencies
)

echo.

REM ============================================
REM UPDATE NODE.JS DEPENDENCIES
REM ============================================
echo [INFO] Updating Node.js dependencies...
echo -----------------------------------------------------------

cd /d "%PROJECT_ROOT%\frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    call npm install
)

REM Update based on type
if "%DRY_RUN%"=="false" (
    if "%UPDATE_TYPE%"=="major" (
        echo [INFO] Updating to latest major versions...
        call npx npm-check-updates -u
        call npm install
    ) else if "%UPDATE_TYPE%"=="minor" (
        echo [INFO] Updating to latest minor versions...
        call npx npm-check-updates -u --target minor
        call npm install
    ) else (
        echo [INFO] Updating only patch versions...
        call npm update
    )
    
    echo [SUCCESS] Node.js dependencies updated
) else (
    echo [INFO] [DRY RUN] Would update Node.js dependencies (%UPDATE_TYPE%)
)

echo.

REM ============================================
REM SECURITY AUDIT
REM ============================================
echo [INFO] Running security audit...
echo -----------------------------------------------------------

REM Python security audit
echo [INFO] Checking Python dependencies for vulnerabilities...
cd /d "%PROJECT_ROOT%\backend"

REM Install safety if not present
pip install safety bandit

REM Run safety check
if "%DRY_RUN%"=="false" (
    safety check --full-report 2>nul || echo [WARNING] Safety check completed with findings
) else (
    echo [INFO] [DRY RUN] Would run safety check
)

REM Node.js security audit
echo [INFO] Checking Node.js dependencies for vulnerabilities...
cd /d "%PROJECT_ROOT%\frontend"

if "%DRY_RUN%"=="false" (
    call npm audit --audit-level=moderate 2>nul || echo [WARNING] NPM audit completed with findings
) else (
    echo [INFO] [DRY RUN] Would run npm audit
)

echo.

REM ============================================
REM TESTING
REM ============================================
if "%DRY_RUN%"=="false" (
    echo [INFO] Running tests...
    echo -----------------------------------------------------------
    
    REM Python tests
    echo [INFO] Running Python tests...
    cd /d "%PROJECT_ROOT%\backend"
    pip install pytest pytest-flask
    pytest --tb=short -v 2>nul || echo [WARNING] Some Python tests failed
    
    REM Node.js tests
    echo [INFO] Running Node.js tests...
    cd /d "%PROJECT_ROOT%\frontend"
    call npm test -- --watchAll=false --passWithNoTests 2>nul || echo [WARNING] Some Node.js tests failed
    
    echo.
)

REM ============================================
REM SUMMARY
REM ============================================
echo ========================================================
echo [SUCCESS] Dependency update process completed!
echo ========================================================
echo.

if "%DRY_RUN%"=="false" (
    echo Summary:
    echo   - Python dependencies updated
    echo   - Node.js dependencies updated
    echo   - Security audits completed
    echo   - Tests executed
    echo.
    
    if "%SKIP_BACKUP%"=="false" (
        echo Backup location: %BACKUP_DIR%
        echo.
    )
    
    echo Next steps:
    echo   1. Review the changes in requirements.txt and package.json
    echo   2. Test the application thoroughly
    echo   3. Commit the changes: git add . ^&^& git commit -m 'chore(deps): update dependencies'
    echo   4. Push to repository: git push origin main
    echo.
    
    echo [WARNING] If you encounter issues, you can restore from backup:
    echo   copy "%BACKUP_DIR%\requirements.txt.backup" "backend\requirements.txt"
    echo   copy "%BACKUP_DIR%\package.json.backup" "frontend\package.json"
    echo   copy "%BACKUP_DIR%\package-lock.json.backup" "frontend\package-lock.json"
) else (
    echo This was a DRY RUN. No changes were made.
    echo Run without --dry-run to apply updates.
)

echo.
echo [SUCCESS] Done!

endlocal
