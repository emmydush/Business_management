# Desktop Application Guide

This project has been configured to be converted into a Windows Desktop Application (.exe) using Electron.

## Prerequisites
- Node.js and npm installed.
- Python installed (for the backend).

## How to Run in Development
To run the application in a desktop window during development:
1. Start the backend:
   ```bash
   cd backend
   python run.py
   ```
2. Start the frontend in Electron:
   ```bash
   cd frontend
   npm run electron:start
   ```

## How to Build the Windows Software (.exe)
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Package the software:
   ```bash
   npx electron-packager . "Business Management System" --platform=win32 --arch=x64 --out=dist --overwrite --icon=public/assets/logo.png --ignore="node_modules/(?!electron-is-dev)"
   ```
   The software will be generated in the `frontend/dist/Business Management System-win32-x64` folder.

## Bundling the Backend (Advanced)
To make the application fully standalone (including the backend), you would typically:
1. Use `PyInstaller` to convert the Flask backend into an `.exe`.
2. Update `main.js` in the frontend to spawn the backend process when the app starts.
3. Include the backend executable in the Electron builder configuration.

Currently, the desktop app is configured to connect to the backend running at `http://localhost:5000`.
