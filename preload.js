const { ipcRenderer, contextBridge } = require('electron');
const path = require('path');

const isPackaged = require('electron').app.isPackaged;
const appPath = __dirname;

contextBridge.exposeInMainWorld('ElectronAPI', {
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    getAppPath: () => appPath,
    isPackaged: isPackaged,
    getResourcePath: (relativePath) => {
        const fullPath = path.join(appPath, relativePath).replace(/\\/g, '/');
        return 'file:///' + fullPath;
    }
});