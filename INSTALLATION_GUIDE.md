# Business Management System - Installation Guide

## Overview
This guide will help you create a distributable installer for the Business Management System with your custom logo icon.

## Prerequisites
- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Your logo file (icon.png) in the project root directory

## Installation Steps

### 1. Prepare the Environment
Navigate to the frontend directory:
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Application
```bash
npm run build
```

### 4. Create the Installer
```bash
npm run electron-pack
```

### 5. Alternative: Use the Build Script
For Windows users, you can use the provided build script:
```bash
cd .. (go back to project root)
build_installer.bat
```

## Installer Features
- ✅ **Custom Logo Icon**: Your logo will be used as the application icon
- ✅ **Desktop Shortcut**: Creates a desktop shortcut during installation
- ✅ **Start Menu Integration**: Adds to Start Menu
- ✅ **Custom Installation Directory**: Users can choose where to install
- ✅ **Windows Installer (NSIS)**: Standard Windows installer format

## Output Files
After building, you will find the installer in:
```
frontend/dist/
├── BusinessManagementSystem Setup.exe
└── ...
```

## Configuration Details

### Icon Configuration
The application uses `icon.png` from the project root as:
- Application window icon
- Desktop shortcut icon
- Start menu icon
- Installer icon

### Electron Configuration
- **App Name**: Business Management System
- **App ID**: com.businessmanagement.app
- **Main File**: `public/electron.js`
- **Icon Path**: `../icon.png`

### Builder Configuration
```json
{
  "build": {
    "appId": "com.businessmanagement.app",
    "productName": "Business Management System",
    "win": {
      "target": "nsis",
      "icon": "../icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

## Development Mode
To test the application during development:
```bash
npm run electron-dev
```

This will:
1. Start the React development server
2. Wait for it to be ready
3. Launch the Electron app with your logo icon

## Troubleshooting

### Icon Not Showing
1. Ensure `icon.png` exists in the project root
2. Check that the icon is a valid PNG file
3. Verify the path in `electron.js` points to the correct location

### Build Fails
1. Make sure all dependencies are installed
2. Check that the React build completes successfully
3. Verify Node.js version is 16 or higher

### Installer Issues
1. Run the build script as administrator
2. Ensure antivirus software doesn't block the build process
3. Check available disk space

## Distribution
The generated `BusinessManagementSystem Setup.exe` file can be:
- Distributed via USB drive
- Hosted on a website for download
- Sent via email (if file size permits)
- Included in software packages

## Support
For technical support with the installation:
1. Check this guide first
2. Verify all prerequisites are met
3. Review the build output for error messages

---
**Note**: This installer includes your custom logo icon as requested and will provide a professional installation experience for end users.
