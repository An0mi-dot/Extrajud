/**
 * dialogs.js — Native OS dialog helpers for EXTRATJUD
 *
 * Replaces in-page alert() / confirm() with real OS-level dialogs via
 * Electron IPC (dialog:alert / dialog:confirm in main.js).
 * These appear outside the app window and do NOT scroll with the page.
 *
 * Usage (add to any HTML page):
 *   <script src="assets/dialogs.js"></script>
 *
 * Then use:
 *   await ipcAlert('Mensagem')
 *   const ok = await ipcConfirm('Mensagem')
 *
 * Falls back to window.alert / window.confirm on non-Electron environments.
 */
(function () {
    const ipc = (typeof require === 'function')
        ? require('electron').ipcRenderer
        : null;

    window.ipcAlert = async function (message, title) {
        if (ipc) {
            await ipc.invoke('dialog:alert', message, title || 'EXTRATJUD');
        } else {
            window.alert(message);
        }
    };

    window.ipcConfirm = async function (message, title) {
        if (ipc) {
            return await ipc.invoke('dialog:confirm', message, title || 'EXTRATJUD');
        } else {
            return window.confirm(message);
        }
    };
})();
