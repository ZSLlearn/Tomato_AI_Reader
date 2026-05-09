const { app, BrowserWindow, shell, dialog, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

const DEV_SERVER_URL = process.env.DEV_SERVER || 'http://localhost:8088';

let mainWindow = null;

function registerProtocol() {
    protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.replace('app://', '');
        let filePath = path.join(__dirname, url);
        
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '..', url);
        }
        
        callback({ path: filePath });
    });
}

function createWindow() {
    registerProtocol();
    
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, 'logo.png'),
        title: 'Tomato Reader - AI智能阅读器',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false
        },
        show: false,
        backgroundColor: '#ffffff'
    });

    if (isDev && process.env.USE_DEV_SERVER === 'true') {
        mainWindow.loadURL(DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, 'index.html'));
        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'PDF文件', extensions: ['pdf'] },
            { name: 'Word文档', extensions: ['docx'] },
            { name: 'PowerPoint', extensions: ['pptx'] },
            { name: 'EPUB电子书', extensions: ['epub'] },
            { name: '文本文件', extensions: ['txt'] },
            { name: '所有支持的文件', extensions: ['pdf', 'docx', 'pptx', 'epub', 'txt'] }
        ]
    });
    
    return result.filePaths;
});
