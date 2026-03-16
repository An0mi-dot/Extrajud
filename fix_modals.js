const fs = require('fs');
const path = require('path');

function fixHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove stray modal pushed to very top (if before <!DOCTYPE html>)
    const doctypeIndex = content.toLowerCase().indexOf('<!doctype html>');
    if (doctypeIndex > 0) {
        content = content.substring(doctypeIndex);
    }
    
    // We will extract ADMIN MODAL and SETTINGS MODAL blocks, remove them from the body,
    // and re-append them right before </body>.
    
    // Get the exact templates from another source or we can inject standard ones.
    const standardSettingsModal = `
    <!-- Settings Modal (New Standard) -->
    <div id="modal-settings" class="settings-modal-overlay" style="display:none;">
        <div class="settings-modal-content">
            <div class="settings-modal-header">
                <h2><i class="fa-solid fa-sliders"></i> Configurações</h2>
                <button id="btn-close-settings" class="settings-close-btn">&times;</button>
            </div>

            <div class="settings-modal-body">
                <div class="settings-sidebar">
                    <button class="settings-tab active" data-tab="geral"><i class="fa-solid fa-wrench"></i> Geral</button>
                    <button class="settings-tab" data-tab="logs"><i class="fa-solid fa-file-lines"></i> Logs</button>
                    <button class="settings-tab" data-tab="sobre"><i class="fa-solid fa-circle-info"></i> Sobre</button>
                </div>

                <div class="settings-content-area">
                    <div id="tab-geral" class="settings-tab-pane active">
                        <h3 class="settings-section-title">Aparência</h3>
                        <p class="settings-section-desc">Personalize o tema visual do aplicativo.</p>

                        <div class="theme-selector-group" style="display:flex; gap:10px; margin-bottom: 25px;">
                            <button class="theme-option" data-theme="light" title="Claro"><i class="fa-solid fa-sun"></i> Claro</button>
                            <button class="theme-option" data-theme="dark" title="Escuro"><i class="fa-solid fa-moon"></i> Escuro</button>
                            <button class="theme-option" data-theme="system" title="Sistema"><i class="fa-solid fa-desktop"></i> Sistema</button>
                        </div>

                        <h3 class="settings-section-title">Comportamento da Janela</h3>
                        <p class="settings-section-desc">Personalize como o Extratjud interage com seu desktop.</p>
                        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
                            <label class="checkbox-container" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                <input type="checkbox" id="chk-minimize-tray" style="width:16px; height:16px;">
                                <span style="font-size:13px; color:var(--text-color);">Minimizar para a bandeja ao fechar</span>
                            </label>
                            <label class="checkbox-container" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                <input type="checkbox" id="chk-always-top" style="width:16px; height:16px;">
                                <span style="font-size:13px; color:var(--text-color);">Manter janela sempre no topo</span>
                            </label>
                        </div>

                        <h3 class="settings-section-title" style="margin-top: 25px;">Notificações</h3>
                        <p class="settings-section-desc">Alertas sobre o status dos processos.</p>
                        <div style="margin-top: 15px; display: flex; flex-direction: column; gap: 12px;">
                            <label class="checkbox-container" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                <input type="checkbox" id="chk-sound-finish" style="width:16px; height:16px;">
                                <span style="font-size:13px; color:var(--text-color);">Emitir som ao finalizar</span>
                            </label>
                            <label class="checkbox-container" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                <input type="checkbox" id="chk-notification-finish" style="width:16px; height:16px;">
                                <span style="font-size:13px; color:var(--text-color);">Notificação do Windows</span>
                            </label>
                        </div>
                    </div>

                    <div id="tab-logs" class="settings-tab-pane">
                         <h3 class="settings-section-title">Gerenciamento de Logs</h3>
                         <p class="settings-section-desc">Centralize os arquivos de registro para facilitar o suporte.</p>
                        <div class="settings-item">
                            <label class="settings-label">Diretório Global de Logs</label>
                            <div class="settings-input-group" style="display:flex; gap:10px; margin-top:10px;">
                                <input type="text" id="inp-global-log" readonly placeholder="Selecione uma pasta..." class="settings-input" style="flex:1; padding:8px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-color); color:var(--text-color);">
                                <button id="btn-sel-log-dir" class="settings-btn-icon" style="padding:8px 12px; border:1px solid var(--border-color); background:var(--card-bg); color:var(--text-color); border-radius:6px; cursor:pointer;"><i class="fa-solid fa-folder-open"></i></button>
                            </div>
                            <small style="display:block; margin-top:5px; color:var(--text-secondary);">Todos os registros serão salvos nesta pasta.</small>
                        </div>
                    </div>

                    <div id="tab-sobre" class="settings-tab-pane">
                        <div style="text-align:center; padding:10px 20px;">
                            <img src="assets/logo.png" style="height:80px; margin-bottom:15px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
                            <h3 style="margin:0; color:var(--primary-color); font-size:24px;">EXTRATJUD</h3>
                            <p style="margin:5px 0; color:var(--text-secondary); font-family:'JetBrains Mono',monospace;">v<span id="settings-app-ver" class="app-version">?.?.?</span></p>
                            <hr style="margin:25px 0; border:0; border-top:1px solid var(--border-color);">
                            <div style="text-align:left; font-size:13px; color:var(--text-secondary);">
                                <p>Desenvolvido por <strong>João Guilherme Almeida Viana</strong><br>
                                Aprendiz Administrativo | Jurídico Contencioso Cível</p>
                            </div>
                            <div style="margin-top:20px; font-size:11px; color:#9ca3af; text-align:left; border-top:1px dashed var(--border-color); padding-top:15px;">
                                <p style="font-weight:600; margin-bottom:5px;">Ambiente:</p>
                                <ul style="columns:2; list-style:none; padding:0; margin:0;">
                                    <li>Electron: <span id="env-electron">...</span></li>
                                    <li>Node: <span id="env-node">...</span></li>
                                    <li>Chrome: <span id="env-chrome">...</span></li>
                                    <li>OS: <span id="env-plat">...</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-modal-footer">
                <button id="btn-save-settings" class="settings-btn-primary" style="padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;"><i class="fa-solid fa-check"></i> Salvar Alterações</button>
            </div>
        </div>
    </div>
    <!-- FIM SETTINGS MODAL -->`;

const standardAdminModal = `
    <!-- ADMIN MODAL (RBAC) -->
    <div id="modal-admin-logic" class="settings-modal-overlay">
        <div class="settings-modal-content" style="max-width: 480px; height: auto; min-height: 250px; overflow: visible;">
            <div class="settings-modal-header" style="padding: 24px; border-bottom: none; background: transparent;">
                <h2><i class="fa-solid fa-user-shield" style="color: var(--primary-color);"></i> &nbsp;Gerenciar Cargos</h2>
                <button id="btn-close-admin-logic" class="settings-close-btn">&times;</button>
            </div>
            
            <div class="settings-modal-body" style="display: block; padding: 0 30px 20px;">
                <p style="font-size: 14px; color: var(--text-secondary); margin-top: 0; margin-bottom: 24px;">
                    Selecione um usuário ou digite o email.
                </p>

                <div class="form-group" style="margin-bottom:15px;">
                    <label class="form-label" style="display:block; margin-bottom:5px; font-weight:600; font-size:13px; color:var(--text-color);"><i class="fa-regular fa-envelope"></i> Email do Usuário</label>
                    <input type="text" id="inp-admin-email" class="form-input" list="admin-users-list" placeholder="exemplo@dominio.com" autocomplete="off" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); box-sizing:border-box;">
                    <datalist id="admin-users-list"></datalist>
                </div>
                
                <div class="form-group">
                    <label class="form-label" style="display:block; margin-bottom:5px; font-weight:600; font-size:13px; color:var(--text-color);"><i class="fa-solid fa-id-badge"></i> Cargo</label>
                    <div style="position: relative;">
                        <select id="sel-admin-role" class="form-input" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-color); appearance: none; cursor: pointer; box-sizing:border-box;">
                            <option value="Admin">Admin (Acesso Total)</option>
                            <option value="Responsável Comarca">Responsável Comarca</option>
                            <option value="Gestor Area">Gestor Área</option>
                            <option value="Jurídico">Jurídico (Visualização)</option>
                            <option value="remove" style="color: #ef4444; font-weight: bold;">❌ REMOVER CARGO</option>
                        </select>
                        <i class="fa-solid fa-chevron-down" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;"></i>
                    </div>
                </div>
            </div>
            
            <div class="settings-modal-footer" style="padding: 20px 30px; background: var(--bg-color); border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                <button id="btn-admin-save" class="settings-btn-primary" style="padding: 10px 20px; border-radius:8px; cursor:pointer; font-weight:600; border:none; background:var(--primary-color); color:#fff;">
                    <i class="fa-solid fa-check"></i> Salvar
                </button>
            </div>
        </div>
    </div>
    <!-- FIM ADMIN MODAL -->`;

    // 1. Remove ANY existing modal-settings, modal-admin-logic
    // To do this safely, we find <div id="modal-settings" and remove its entire block. 
    // Best way is using regex matching the opening and hoping we get the close right, OR just stripping them completely.
    
    // Instead of complex AST, let's remove everything between:
    // <div id="modal-settings" ---> until next top-level modal logic or scripts.
    // Actually, better to just completely clean all modal html code from inside .container or main-content.
    
    // Manual String cleaning:
    const idsToRemove = ["modal-settings", "modal-admin-logic"];
    for(let id of idsToRemove) {
        let startIdx = content.indexOf(`id="${id}"`);
        if (startIdx === -1) startIdx = content.indexOf(`id='${id}'`);
        
        while(startIdx > -1) {
            // Find the opening <div before the id
            let openingDiv = content.lastIndexOf('<div', startIdx);
            
            // Count divs
            let open = 1;
            let current = startIdx;
            while(open > 0 && current < content.length) {
                let nextOpen = content.indexOf('<div', current);
                let nextClose = content.indexOf('</div', current);
                
                if (nextClose === -1) break; // error
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    open++;
                    current = nextOpen + 4;
                } else {
                    open--;
                    current = nextClose + 6;
                }
            }
            
            // now 'current' points past the closing </div>
            content = content.substring(0, openingDiv) + content.substring(current);
            
            startIdx = content.indexOf(`id="${id}"`);
            if (startIdx === -1) startIdx = content.indexOf(`id='${id}'`);
        }
    }

    // Now insert them exactly before </body>
    const appendModals = standardSettingsModal + '\n' + standardAdminModal + '\n';
    content = content.replace('</body>', appendModals + '\n</body>');

    fs.writeFileSync(filePath, content);
}

fixHtmlFile('public/hub_subsidios.html');
// Let's also run it on index.html just to be absolutely sure index is clean
fixHtmlFile('public/index.html');
console.log('Fixed modals and inserted them safely at the end of the DOM.');
