const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let backendProcess = null;

// Function to start the backend server
function startBackendServer() {
    if (!isDev) {
        // In production, start the Python backend server
        const backendPath = path.join(process.resourcesPath, 'backend_server.exe');
        
        console.log('Starting backend server:', backendPath);
        
        backendProcess = spawn(backendPath, {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        backendProcess.stdout.on('data', (data) => {
            console.log(`Backend stdout: ${data}`);
        });
        
        backendProcess.stderr.on('data', (data) => {
            console.error(`Backend stderr: ${data}`);
        });
        
        backendProcess.on('close', (code) => {
            console.log(`Backend process exited with code ${code}`);
        });
        
        // Wait a moment for the server to start
        return new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return Promise.resolve();
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        title: "Business Management System",
        icon: path.join(__dirname, 'assets', 'logo.png'),
        show: false
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(app.getAppPath(), 'build', 'index.html')}`;

    console.log('App Path:', app.getAppPath());
    console.log('Loading URL:', startUrl);
    win.loadURL(startUrl);

    win.once('ready-to-show', () => {
        win.show();
        win.maximize();
    });

    if (isDev) {
        win.webContents.openDevTools();
    } else {
        win.setMenuBarVisibility(false);
    }

    win.on('closed', () => {
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    });
}

app.whenReady().then(async () => {
    await startBackendServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});