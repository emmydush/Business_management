@echo off
REM Script to create a superadmin user in Render environment
REM Usage: create_superadmin_render.bat username email password [first_name] [last_name]

set USERNAME=%1
set EMAIL=%2
set PASSWORD=%3
set FIRST_NAME=%4
set LAST_NAME=%5

REM Check if required parameters are provided
if "%USERNAME%"=="" (
    echo Error: Missing username parameter
    echo Usage: %0 username email password [first_name] [last_name]
    exit /b 1
)

if "%EMAIL%"=="" (
    echo Error: Missing email parameter
    echo Usage: %0 username email password [first_name] [last_name]
    exit /b 1
)

if "%PASSWORD%"=="" (
    echo Error: Missing password parameter
    echo Usage: %0 username email password [first_name] [last_name]
    exit /b 1
)

REM Set default values if not provided
if "%FIRST_NAME%"=="" set FIRST_NAME=Super
if "%LAST_NAME%"=="" set LAST_NAME=Admin

echo Creating superadmin user: %USERNAME% with email: %EMAIL%

REM Change to app directory and run the Python script
cd /d C:\app
python scripts\create_superadmin.py --username "%USERNAME%" --email "%EMAIL%" --password "%PASSWORD%" --first-name "%FIRST_NAME%" --last-name "%LAST_NAME%"

if %errorlevel% == 0 (
    echo Superadmin user created successfully!
) else (
    echo Failed to create superadmin user!
    exit /b 1
)