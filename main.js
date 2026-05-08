const { app, BrowserWindow, ipcMain } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      touchEvents: true // Enables touch screen support
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Listen for the close signal from the UI
ipcMain.on('close-app', () => {
  app.quit();
});
