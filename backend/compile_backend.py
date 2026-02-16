import os
import subprocess
import sys
from pathlib import Path

def compile_backend():
    """Compile the backend server to an executable using PyInstaller"""
    
    # Install PyInstaller if not already installed
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
    
    # Define paths
    backend_script = 'backend_server.py'
    spec_file = 'backend_server.spec'
    
    # Create PyInstaller spec file for building the executable
    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['{backend_script}'],
    pathex=[],
    binaries=[],
    datas=[
        ('./app', 'app'),  # Include the app package
        ('./models', 'models'),  # Include models if separate
        ('requirements_packaged.txt', '.'),  # Include requirements
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={{}},
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
"""
    
    with open(spec_file, 'w') as f:
        f.write(spec_content)
    
    # Run PyInstaller with the spec file
    subprocess.check_call(['pyinstaller', spec_file])
    
    print("Backend server compiled successfully!")
    print("Executable created in ./dist/backend_server.exe")

if __name__ == "__main__":
    compile_backend()