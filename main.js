const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
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
