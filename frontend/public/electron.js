const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

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
        app.quit();
    });
}

app.whenReady().then(createWindow);

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
