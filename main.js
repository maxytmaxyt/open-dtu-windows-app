const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const AutoLaunch = require('auto-launch');

const store = new Store();
let win;

// Autostart Setup
const dtuAutoLauncher = new AutoLaunch({
    name: 'OpenDTU Pro',
    path: app.getPath('exe'),
});

// Das eingebettete HTML/CSS Interface
const uiHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { background: #0d1117; color: white; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .header { display: flex; justify-content: space-between; padding: 15px; background: #161b22; align-items: center; border-bottom: 1px solid #30363d; }
        .content { flex: 1; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .card { background: #161b22; padding: 30px; border-radius: 15px; border: 1px solid #30363d; width: 350px; text-align: center; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 5px; border: 1px solid #30363d; background: #0d1117; color: white; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #238636; border: none; color: white; font-weight: bold; cursor: pointer; border-radius: 5px; margin-top: 10px; }
        .val { font-size: 3rem; color: #39d353; font-weight: bold; }
        #exit-btn { background: #f85149; width: 40px; height: 40px; border-radius: 50%; }
    </style>
</head>
<body>
    <div class="header">
        <span>OpenDTU Pro Dashboard</span>
        <button id="exit-btn" onclick="window.closeApp()">✕</button>
    </div>
    <div class="content" id="main-ui">
        <!-- Inhalt wird per JS gewechselt -->
    </div>

    <script>
        const { ipcRenderer } = require('electron');
        window.closeApp = () => ipcRenderer.send('exit');

        function showSetup() {
            document.getElementById('main-ui').innerHTML = \`
                <div class="card">
                    <h2>Setup</h2>
                    <input type="text" id="ip" placeholder="OpenDTU IP">
                    <input type="password" id="pw" placeholder="Passwort">
                    <label><input type="checkbox" id="auto" checked> Autostart</label>
                    <button onclick="save()">Speichern</button>
                </div>\`;
        }

        function showDashboard(ip) {
            document.getElementById('main-ui').innerHTML = \`
                <div class="card">
                    <p>Produktion (\${ip})</p>
                    <div class="val">542 W</div>
                    <button style="background:#30363d" onclick="ipcRenderer.send('reset')">Einstellungen</button>
                </div>\`;
        }

        function save() {
            const data = {
                ip: document.getElementById('ip').value,
                pw: document.getElementById('pw').value,
                auto: document.getElementById('auto').checked
            };
            ipcRenderer.send('save-config', data);
        }

        ipcRenderer.on('init', (e, config) => {
            if(config.ip) showDashboard(config.ip);
            else showSetup();
        });
    </script>
</body>
</html>
`;

function createWindow() {
    win = new BrowserWindow({
        fullscreen: true,
        frame: false,
        skipTaskbar: false, // Erscheint in der Taskleiste
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    // Lädt das HTML direkt aus dem String
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(uiHTML)}`);

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('init', {
            ip: store.get('ip'),
            pw: store.get('pw')
        });
    });
}

app.whenReady().then(createWindow);

ipcMain.on('save-config', (event, data) => {
    store.set('ip', data.ip);
    store.set('pw', data.pw);
    if(data.auto) dtuAutoLauncher.enable();
    else dtuAutoLauncher.disable();
    win.webContents.send('init', data);
});

ipcMain.on('reset', () => {
    store.clear();
    win.webContents.send('init', {});
});

ipcMain.on('exit', () => app.quit());
