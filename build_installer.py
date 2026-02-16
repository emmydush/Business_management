import os
import subprocess
import sys
import shutil
from pathlib import Path
import json

def build_frontend():
    """Build the React frontend application"""
    print("Building frontend application...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        raise FileNotFoundError(f"Frontend directory not found at {frontend_dir}")
    
    os.chdir(frontend_dir)
    
    # Install frontend dependencies
    subprocess.run(["npm", "install", "--legacy-peer-deps"], check=True)
    
    # Build the React app
    subprocess.run(["npm", "run", "build"], check=True)
    
    print("Frontend build completed!")
    os.chdir("..")  # Return to root directory


def compile_backend():
    """Compile the backend server to an executable using PyInstaller"""
    print("Compiling backend server...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        raise FileNotFoundError(f"Backend directory not found at {backend_dir}")
    
    os.chdir(backend_dir)
    
    # Install PyInstaller if not already installed
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    # Install backend dependencies
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_packaged.txt"], check=True)
    
    # Create PyInstaller spec file for building the executable
    spec_content = '''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['backend_server.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('./app', 'app'),  # Include the app package
        ('requirements_packaged.txt', '.'),  # Include requirements
    ],
    hiddenimports=[
        'flask',
        'sqlalchemy',
        'flask_sqlalchemy',
        'flask_bcrypt',
        'flask_jwt_extended',
        'flask_cors',
        'flask_mail',
        'dotenv',
        'urllib.parse',
        'waitress',
        'jinja2.ext',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='backend_server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''
    
    with open('backend_server.spec', 'w') as f:
        f.write(spec_content)
    
    # Run PyInstaller with the spec file
    subprocess.run(['pyinstaller', 'backend_server.spec'], check=True)
    
    print("Backend server compiled successfully!")
    os.chdir("..")  # Return to root directory


def package_electron_app():
    """Package the Electron application with electron-builder"""
    print("Packaging Electron application...")
    
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        raise FileNotFoundError(f"Frontend directory not found at {frontend_dir}")
    
    os.chdir(frontend_dir)
    
    # Copy the backend executable to the right place for electron-builder to find it
    backend_exe = Path("../backend/dist/backend_server.exe")
    if backend_exe.exists():
        # Create a directory for extra resources if needed
        resources_dir = Path("resources")
        resources_dir.mkdir(exist_ok=True)
        shutil.copy2(backend_exe, resources_dir / "backend_server.exe")
        
        # Update package.json to point to the correct location
        with open("package.json", "r", encoding="utf-8") as f:
            package_json = json.load(f)
        
        # Update the extraResources section
        package_json["build"]["extraResources"] = [
            {
                "from": "resources/backend_server.exe",
                "to": "backend_server.exe"
            }
        ]
        
        with open("package.json", "w", encoding="utf-8") as f:
            json.dump(package_json, f, indent=2)
    
    # Install electron-builder if not already installed
    subprocess.run(["npm", "install", "--save-dev", "electron-builder"], check=True)
    
    # Build the Electron app for Windows
    subprocess.run(["npm", "run", "electron:build", "--", "--win"], check=True)
    
    print("Electron application packaged successfully!")
    os.chdir("..")  # Return to root directory


def main():
    """Main packaging function"""
    print("Starting packaging process for Business Management System...")
    
    try:
        # Step 1: Compile backend first
        compile_backend()
        
        # Step 2: Build frontend
        build_frontend()
        
        # Step 3: Package Electron app
        package_electron_app()
        
        print("\nPackaging completed successfully!")
        print("Setup executable should be available in frontend/dist/")
        
        # Show the contents of the dist directory
        dist_dir = Path("frontend/dist")
        if dist_dir.exists():
            print("\nFiles in dist directory:")
            for file in dist_dir.rglob("*"):
                if file.is_file():
                    print(f"  - {file.relative_to(dist_dir)}")
        
    except Exception as e:
        print(f"Error during packaging: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()