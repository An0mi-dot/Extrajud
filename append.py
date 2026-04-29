# -*- coding: utf-8 -*-
js_code = """
// ==========================================
// CONFIGURACOES GLOBAIS (MODAL DE CONFIG)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Settings Menu Open/Close Logic
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const modalSettings = document.getElementById('modal-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    if(btnOpenSettings && modalSettings) {
        btnOpenSettings.addEventListener('click', () => modalSettings.style.display = 'flex');
    }
    if(btnCloseSettings && modalSettings) {
        btnCloseSettings.addEventListener('click', () => modalSettings.style.display = 'none');
    }
    if(btnSaveSettings && modalSettings) {
        btnSaveSettings.addEventListener('click', () => {
            modalSettings.style.display = 'none';
        });
    }

    // 2. Modal Tabs Logic
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-tab');

            // Remove active from all tabs
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Hide all panes
            document.querySelectorAll('.settings-tab-pane').forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });

            // Show target pane
            const pane = document.getElementById('tab-' + target);
            if(pane) {
                pane.classList.add('active');
                pane.style.display = 'block';
            }
        });
    });

    // 3. Log Directory Logic
    const btnSelLogDir = document.getElementById('btn-sel-log-dir');
    const inpGlobalLog = document.getElementById('inp-global-log');
    
    if (inpGlobalLog) {
        const savedLogDir = localStorage.getItem('globalLogDir');
        if (savedLogDir) {
            inpGlobalLog.value = savedLogDir;
        }
    }

    if (btnSelLogDir && typeof require !== 'undefined') {
        btnSelLogDir.addEventListener('click', async () => {
            try {
                const { ipcRenderer } = require('electron');
                const result = await ipcRenderer.invoke('dialog:openDirectory');
                if (result && !result.canceled && result.filePaths.length > 0) {
                    const selectedPath = result.filePaths[0];
                    if (inpGlobalLog) inpGlobalLog.value = selectedPath;
                    localStorage.setItem('globalLogDir', selectedPath);
                }
            } catch (e) {
                console.error('Erro ao abrir dialog de pasta:', e);
            }
        });
    }
});
"""

with open('public/assets/theme.js', 'a', encoding='utf-8') as f:
    f.write(js_code)
print("js appended to theme.js")
