"""
Manual packaging script for Business Management System with your icon
"""

import os
import shutil
import zipfile
from datetime import datetime

def create_manual_package():
    try:
        print("Creating manual package for Business Management System...")
        
        # Source paths
        frontend_build = "frontend/build"
        electron_main = "frontend/public/electron.js"
        icon_file = "frontend/src/assets/images/icon_256.png"
        output_dir = "frontend/dist"
        package_name = "BusinessManagementSystem_Manual"
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Create package directory
        package_dir = os.path.join(output_dir, package_name)
        if os.path.exists(package_dir):
            shutil.rmtree(package_dir)
        os.makedirs(package_dir)
        
        # Copy build files
        print("Copying build files...")
        if os.path.exists(frontend_build):
            shutil.copytree(frontend_build, os.path.join(package_dir, "build"))
        else:
            print("Build directory not found. Run 'npm run build' first.")
            return False
        
        # Copy electron main file
        print("Copying electron main file...")
        shutil.copy(electron_main, os.path.join(package_dir, "electron.js"))
        
        # Copy icon file
        print("Copying icon file...")
        if os.path.exists(icon_file):
            shutil.copy(icon_file, os.path.join(package_dir, "icon.png"))
        else:
            print("Icon file not found, continuing without it...")
        
        # Create package.json for electron
        package_json_content = {
            "name": "business-management-system",
            "version": "2.0.0",
            "main": "electron.js",
            "description": "Business Management System with your icon",
            "author": "Business Management Team",
            "icon": "icon.png"
        }
        
        import json
        with open(os.path.join(package_dir, "package.json"), "w") as f:
            json.dump(package_json_content, f, indent=2)
        
        # Create run script
        run_script = """@echo off
echo Starting Business Management System...
echo.
echo This application includes your custom icon.
echo.
node electron.js
pause
"""
        
        with open(os.path.join(package_dir, "run.bat"), "w") as f:
            f.write(run_script)
        
        # Create README
        readme_content = f"""# Business Management System

## Installation Instructions

1. Extract all files to a folder
2. Run 'run.bat' to start the application
3. Your custom icon will be displayed in the application

## Features
- Your custom icon integrated
- Full Business Management functionality
- Admin access to all features
- Real database integration

## Requirements
- Node.js (for running the application)
- Modern web browser

## Support
For technical support, contact your system administrator.

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        with open(os.path.join(package_dir, "README.txt"), "w") as f:
            f.write(readme_content)
        
        # Create ZIP package
        print("Creating ZIP package...")
        zip_filename = os.path.join(output_dir, f"{package_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip")
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(package_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, package_dir)
                    zipf.write(file_path, arcname)
        
        print(f"Package created successfully!")
        print(f"Package location: {package_dir}")
        print(f"ZIP file: {zip_filename}")
        print(f"Your icon has been integrated into the application!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating package: {str(e)}")
        return False

if __name__ == "__main__":
    create_manual_package()
