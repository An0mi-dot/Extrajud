// Preload script para expor APIs seguras do Electron ao renderer process
const { ipcRenderer } = require('electron');

// Expor ipcRenderer globalmente para que os scripts HTML possam acessar
window.ipcRenderer = ipcRenderer;

console.log('✅ Preload script carregado. ipcRenderer exposto em window.ipcRenderer');
