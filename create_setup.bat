@echo off
echo Building Business Management System Setup...

REM Change to the project directory
cd /d "%~dp0"

echo Installing Python dependencies...
python -m pip install -r backend\requirements_packaged.txt

echo Running packaging script...
python build_installer.py

pause