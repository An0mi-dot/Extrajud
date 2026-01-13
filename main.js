const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const automacaoService = require('./automacao_service');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true, // Oculta a barra de menu padrão
    icon: path.join(__dirname, 'assets', 'logo.png'), // Ícone da janela e barra de tarefas
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
    }
  });

  mainWindow.setMenu(null); // Remove o menu completamente
  mainWindow.loadFile('index.html');
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
  // Executa a automação nativa (Node.js)
  // Passamos o messageSender (event.sender) para logs
  // E o ipcMain como inputReceiver para ouvir eventos de input
  // args contém { user, pass }
  automacaoService.runAutomation(event.sender, ipcMain, args);
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
