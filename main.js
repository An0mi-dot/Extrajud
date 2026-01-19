const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const automacaoService = require('./automacao_service');

let mainWindow;

// --- Dev Live-Reload (only in development) ---
if (process.env.NODE_ENV !== 'production') {
  try {
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, 'node_modules', 'electron')),
      awaitWriteFinish: true,
      ignored: /node_modules|[\/\\]\./
    });
    console.log('Dev: electron-reload enabled');
  } catch (e) {
    console.log('Dev: electron-reload not available or failed to initialize', e);
  }
}

// Global flag set by automation service to indicate a running automation
global.isAutomationRunning = false;

// Prevent quitting when automation is active
app.on('before-quit', (e) => {
  if (global.isAutomationRunning) {
    e.preventDefault();
    const choice = dialog.showMessageBoxSync({
      type: 'warning',
      buttons: ['Cancelar', 'Forçar Saída'],
      defaultId: 0,
      cancelId: 0,
      title: 'Automação em Execução',
      message: 'Uma automação está em execução. Deseja forçar a saída (isso pode deixar processos órfãos)?',
      detail: 'Escolha "Cancelar" para interromper a automação com segurança antes de sair.'
    });
    if (choice === 1) {
      // User chose to force quit - allow quit to continue
      global.isAutomationRunning = false;
      app.exit(0);
    }
  }
});

// --- Persistência de Estado via app.getPath('userData') ---
const STATE_FILE = path.join(app.getPath('userData'), 'state.json');

ipcMain.handle('load-app-state', async () => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('load-app-state error', e);
  }
  return {};
});

ipcMain.on('save-app-state', (event, state) => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('save-app-state error', e);
  }
});

// State helpers used by update routines
function readStateFile() {
  try {
    if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) || {};
  } catch (e) { console.error('readStateFile', e); }
  return {};
}

function writeStateFile(state) {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8'); }
  catch (e) { console.error('writeStateFile', e); }
}

function fetchJson(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.get(url, { timeout, headers: { 'User-Agent': 'EXTRATJUD-Updater' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    } catch (e) { reject(e); }
  });
}

// --- Update IPC Handlers ---
ipcMain.handle('get-app-version', async () => {
  try { return require(path.join(__dirname, 'package.json')).version || '0.0.0'; }
  catch (e) { return '0.0.0'; }
});

ipcMain.handle('get-update-config', async () => {
  try {
    const state = readStateFile();
    let pkg = {};
    try { pkg = require(path.join(__dirname, 'package.json')); } catch (e) { pkg = {}; }
    return {
      updateServer: (state.update && state.update.updateServer) || pkg.updateServer || null,
      autoUpdate: (state.update && state.update.autoUpdate) || false
    };
  } catch (e) { console.error('get-update-config', e); return { updateServer: null, autoUpdate: false }; }
});

ipcMain.handle('set-update-config', async (event, cfg) => {
  try {
    const state = readStateFile();
    state.update = state.update || {};
    if (typeof cfg.updateServer === 'string') state.update.updateServer = cfg.updateServer;
    if (typeof cfg.autoUpdate === 'boolean') state.update.autoUpdate = cfg.autoUpdate;
    writeStateFile(state);
    return { ok: true };
  } catch (e) { console.error('set-update-config', e); return { ok: false, error: e.message }; }
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const state = readStateFile();
    const updateServer = (state.update && state.update.updateServer) || (require(path.join(__dirname, 'package.json')).updateServer) || null;
    if (!updateServer) return { error: 'no_update_server' };
    const meta = await fetchJson(updateServer);
    const localVer = require(path.join(__dirname, 'package.json')).version || '0.0.0';
    const latest = meta.version || meta.tag_name || null;
    if (!latest) return { error: 'no_version_in_meta', meta };
    const toParts = (v) => (''+v).replace(/^v/i,'').split('.').map(n => parseInt(n)||0);
    const L = toParts(latest), C = toParts(localVer);
    for (let i=0;i<Math.max(L.length,C.length);i++) {
      if ((L[i]||0) > (C[i]||0)) return { updateAvailable: true, latestVersion: latest, changelog: meta.notes || meta.body || meta.changelog || '', url: meta.url || meta.html_url || meta.download_url || updateServer };
      if ((L[i]||0) < (C[i]||0)) return { updateAvailable: false };
    }
    return { updateAvailable: false };
  } catch (e) { console.error('check-for-updates error', e); return { error: e.message }; }
});

ipcMain.on('perform-update', (event, url) => {
  try { if (url) shell.openExternal(url); }
  catch (e) { console.error('perform-update', e); }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true, // Oculta a barra de menu padrão
    icon: path.join(__dirname, 'assets', 'logo2.png'), // Ícone da janela e barra de tarefas
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  });

  mainWindow.setMenu(null); // Remove o menu completamente
  mainWindow.loadFile('index.html');

  // Send initial automation status to renderer after load
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('automation-status', global.isAutomationRunning || false);
  });
}

app.whenReady().then(() => {
  createWindow();

  // check auto-update on startup if enabled (opt-in)
  (async () => {
    try {
      const state = readStateFile();
      const updateCfg = (state.update && state.update) || {};
      const updateServer = updateCfg.updateServer || (require(path.join(__dirname, 'package.json')).updateServer) || null;
      if (updateCfg.autoUpdate && updateServer) {
        try {
          const meta = await fetchJson(updateServer);
          const localVer = require(path.join(__dirname, 'package.json')).version || '0.0.0';
          const latest = meta.version || meta.tag_name || null;
          const toParts = (v) => (''+v).replace(/^v/i,'').split('.').map(n => parseInt(n)||0);
          const L = toParts(latest), C = toParts(localVer);
          let newer = false;
          for (let i=0;i<Math.max(L.length,C.length);i++) {
            if ((L[i]||0) > (C[i]||0)) { newer = true; break; }
            if ((L[i]||0) < (C[i]||0)) break;
          }
          if (newer && (meta.url || meta.html_url || meta.download_url)) {
            shell.openExternal(meta.url || meta.html_url || meta.download_url);
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  })();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handler ---
ipcMain.on('run-script', (event, args) => {
  // Executa a automação nativa (Node.js) -> Citações/Intimações
  automacaoService.runAutomation(event.sender, ipcMain, args);
});

ipcMain.on('run-archived-script', (event, args) => {
  // Executa a automação nativa (Node.js) -> Arquivados
  automacaoService.runArchivedAutomation(event.sender, ipcMain, args);
});

ipcMain.on('run-pje-script', (event, args) => {
    // Executa a automação nativa (Node.js) -> PJE
    automacaoService.runPjeAutomation(event.sender, ipcMain, args);
});

ipcMain.on('stop-script', (event) => {
    automacaoService.stopAutomation(event.sender);
    event.sender.send('log-message', 'Processo de parada iniciado...');
    
    // Resetar UI após delay
    setTimeout(() => {
        event.sender.send('script-finished', 1);
    }, 2000);
});

// Mapeamento de Entrada do Usuário
// O front-end envia 'send-input' quando clica em CONFIRMAR
ipcMain.on('send-input', (event, input) => {
    // Repassa como evento interno que o automacao_service está esperando
    // O service espera 'user-confirm-input'
    console.log("Recebido input do usuário, repassando...");
    ipcMain.emit('user-confirm-input');
});

ipcMain.on('pje-input-response', (event, response) => {
    console.log("Recebido resposta PJE:", response);
    ipcMain.emit('pje-input-received', response);
});

ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});
