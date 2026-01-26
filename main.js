const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execSync } = require('child_process');
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
const PLAYWRIGHT_DIR = path.join(app.getPath('userData'), 'playwright-storage');
const PJE_STORAGE = path.join(PLAYWRIGHT_DIR, 'pje.json');

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
    // Defensive: some renderers call save-app-state without a payload; ignore to avoid overwriting with undefined
    if (typeof state === 'undefined' || state === null) return;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('save-app-state error', e);
  }
});

// Handler requested by SharePoint service to bring the application window to front
ipcMain.on('bring-window-front', (event, args) => {
  try {
    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
    if (!win) return;
    // Temporarily set alwaysOnTop to ensure visibility, then restore shortly after
    win.setAlwaysOnTop(true, 'screen');
    setTimeout(() => {
      try { win.setAlwaysOnTop(false); } catch (e) { /* ignore */ }
      try { if (!win.isDestroyed()) win.focus(); } catch(e) { }
    }, 300);
  } catch (e) {
    console.error('bring-window-front handler error', e);
  }
});

// SharePoint preview and creation handlers
ipcMain.handle('sharepoint:get-preview', async (event, args) => {
  try {
    const runner = require('./sharepoint_runner');
    const res = await runner.getPreview(args || {}, event.sender);
    return res;
  } catch (e) {
    console.error('sharepoint:get-preview error', e);
    return { ok: false, error: e && e.message };
  }
});

ipcMain.handle('sharepoint:create', async (event, args) => {
  try {
    const runner = require('./sharepoint_runner');
    const res = await runner.createSequential(args || {}, event.sender);
    return res;
  } catch (e) {
    console.error('sharepoint:create error', e);
    return { ok: false, error: e && e.message };
  }
});

// Start a long-lived session: opens Edge, navigates and returns a sessionId + preview. Browser stays open until create-session is called or timeout.
ipcMain.handle('sharepoint:start-session', async (event, args) => {
  try {
    const runner = require('./sharepoint_runner');
    const res = await runner.startSession(args || {}, event.sender);
    return res;
  } catch (e) {
    console.error('sharepoint:start-session error', e);
    return { ok: false, error: e && e.message };
  }
});

// Create using an existing session and then close it
ipcMain.handle('sharepoint:create-session', async (event, args) => {
  try {
    const runner = require('./sharepoint_runner');
    const res = await runner.createInSession(args && args.sessionId ? args.sessionId : null, args || {}, event.sender);
    return res;
  } catch (e) {
    console.error('sharepoint:create-session error', e);
    return { ok: false, error: e && e.message };
  }
});

// Convert a browser dump (localStorage/sessionStorage/cookies) to Playwright storageState format
function convertToPlaywrightStorage(payload) {
  try {
    if (!payload) throw new Error('no_payload');
    const origin = payload.origin || (payload.url ? new URL(payload.url).origin : null);
    const domain = origin ? new URL(origin).hostname : null;

    // Normalize cookies: accept array or JSON-stringed array
    let cookies = payload.cookies || [];
    if (typeof cookies === 'string') {
      try { cookies = JSON.parse(cookies); } catch (e) { cookies = []; }
    }
    cookies = Array.isArray(cookies) ? cookies : [];

    const cookieObjs = cookies.map(c => ({
      name: String(c.name || ''),
      value: String(c.value || ''),
      domain: c.domain || domain || (origin ? new URL(origin).hostname : ''),
      path: c.path || '/',
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      sameSite: c.sameSite || 'Lax'
    })).filter(c => c.name);

    // Convert localStorage object to array form expected by Playwright
    const local = payload.localStorage || {};
    const localArr = Object.keys(local || {}).map(k => ({ name: String(k), value: String(local[k]) }));

    const storage = {
      cookies: cookieObjs,
      origins: []
    };
    if (origin) storage.origins.push({ origin, localStorage: localArr });

    return storage;
  } catch (e) {
    throw e;
  }
}

// IPC: import PJE session (payload can be object or string) - now merges with existing storage
ipcMain.handle('pje:import-session', async (event, payload) => {
  try {
    let parsed = payload;
    if (typeof payload === 'string') {
      try { parsed = JSON.parse(payload); } catch (e) { /* keep as string - conversion will fail */ }
    }

    const incoming = convertToPlaywrightStorage(parsed);

    // Read any existing storage (project-local and userData)
    let existing = null;
    try {
      if (fs.existsSync(PJE_STORAGE)) existing = JSON.parse(fs.readFileSync(PJE_STORAGE, 'utf8'));
    } catch (e) { /* ignore */ }
    try {
      const userPje = path.join(app.getPath('userData'), 'playwright-storage', 'pje.json');
      if (!existing && fs.existsSync(userPje)) existing = JSON.parse(fs.readFileSync(userPje, 'utf8'));
    } catch (e) { /* ignore */ }

    // Merge cookies (unique by name+domain+path) - incoming wins
    const cookieKey = (c) => `${c.name || ''}|${c.domain || ''}|${c.path || '/'}|${c.value || ''}`;
    const cookiesMap = new Map();
    (existing && Array.isArray(existing.cookies) ? existing.cookies : []).forEach(c => {
      const key = `${c.name || ''}|${c.domain || ''}|${c.path || '/'}|${c.value || ''}`;
      cookiesMap.set(key, c);
    });
    (incoming && Array.isArray(incoming.cookies) ? incoming.cookies : []).forEach(c => {
      const key = `${c.name || ''}|${c.domain || ''}|${c.path || '/'}|${c.value || ''}`;
      cookiesMap.set(key, c);
    });
    const mergedCookies = Array.from(cookiesMap.values());

    // Merge origins/localStorage: for same origin, merge key/value pairs (incoming wins)
    const originMap = new Map();
    const toLocalMap = (arr) => (arr || []).reduce((acc, i) => { acc[String(i.name)] = String(i.value); return acc; }, {});

    (existing && Array.isArray(existing.origins) ? existing.origins : []).forEach(o => {
      originMap.set(o.origin, { origin: o.origin, local: toLocalMap(o.localStorage) });
    });
    (incoming && Array.isArray(incoming.origins) ? incoming.origins : []).forEach(o => {
      const prev = originMap.get(o.origin) || { origin: o.origin, local: {} };
      const incomingLocal = toLocalMap(o.localStorage);
      // Merge: incoming overrides existing keys
      const mergedLocal = Object.assign({}, prev.local || {}, incomingLocal || {});
      originMap.set(o.origin, { origin: o.origin, local: mergedLocal });
    });

    const mergedOrigins = Array.from(originMap.values()).map(o => ({ origin: o.origin, localStorage: Object.keys(o.local).map(k => ({ name: k, value: String(o.local[k]) })) }));

    const merged = { cookies: mergedCookies, origins: mergedOrigins };

    // Ensure directories exist and write both local and userData copies
    if (!fs.existsSync(PLAYWRIGHT_DIR)) fs.mkdirSync(PLAYWRIGHT_DIR, { recursive: true });
    fs.writeFileSync(PJE_STORAGE, JSON.stringify(merged, null, 2), 'utf8');

    try {
      const userDir = path.join(app.getPath('userData'), 'playwright-storage');
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
      fs.writeFileSync(path.join(userDir, 'pje.json'), JSON.stringify(merged, null, 2), 'utf8');
    } catch (e) { /* ignore userData write failures */ }

    return { ok: true, path: PJE_STORAGE };
  } catch (e) {
    console.error('pje:import-session error', e);
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
});

ipcMain.handle('pje:has-session', async () => {
  try {
    const local = path.join(__dirname, 'playwright-storage', 'pje.json');
    if (fs.existsSync(PJE_STORAGE)) return true;
    if (fs.existsSync(local)) return true;
    return false;
  } catch (e) { return false; }
});

ipcMain.handle('pje:get-session', async () => {
  try { if (fs.existsSync(PJE_STORAGE)) return JSON.parse(fs.readFileSync(PJE_STORAGE, 'utf8')); } catch (e) { console.error('pje:get-session error', e); }
  return null;
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

function fetchJson(url, timeout = 15000, maxRetries = 2) {
  // Robust fetch: handles redirects, retries and longer timeout to avoid spurious timeouts
  return new Promise((resolve, reject) => {
    const maxRedirects = 5;
    const attempt = (u, attemptNo = 0, redirectsLeft = maxRedirects) => {
      try {
        const req = https.get(u, { timeout, headers: { 'User-Agent': 'EXTRATJUD-Updater' } }, (res) => {
          // Follow redirects
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
            const loc = String(res.headers.location).startsWith('http') ? res.headers.location : new URL(res.headers.location, u).toString();
            res.resume();
            return attempt(loc, attemptNo, redirectsLeft - 1);
          }

          if (res.statusCode < 200 || res.statusCode >= 400) {
            let eData = '';
            res.on('data', c => eData += c);
            res.on('end', () => reject(new Error(`HTTP ${res.statusCode} fetching ${u}: ${eData}`)));
            return;
          }

          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) {
              // If JSON parse fails, return raw text so caller can provide a helpful error
              resolve({ __raw: data });
            }
          });
        });

        req.on('error', (err) => {
          if (attemptNo < maxRetries) {
            setTimeout(() => attempt(u, attemptNo + 1, redirectsLeft), 300 * (attemptNo + 1));
          } else reject(err);
        });

        req.on('timeout', () => {
          req.destroy();
          if (attemptNo < maxRetries) {
            setTimeout(() => attempt(u, attemptNo + 1, redirectsLeft), 500 * (attemptNo + 1));
          } else reject(new Error('timeout'));
        });
      } catch (e) { reject(e); }
    };
    attempt(url, 0, maxRedirects);
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

// get-service-versions handler removed (service-specific versions disabled)

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
    if (meta && meta.__raw) {
      // Provide clearer error when endpoint returns non-JSON (commonly a HTML page)
      const snippet = String(meta.__raw).slice(0, 1000);
      // If user pointed to a GitHub release page, suggest raw URL
      let suggestion = null;
      try {
        const m = updateServer.match(/github\.com\/([^\/]+)\/([^\/]+)\/releases\/(?:tag|download)\/(.+)/i);
        if (m) suggestion = `https://raw.githubusercontent.com/${m[1]}/${m[2]}/main/updates.json`;
      } catch (__) {}
      return { error: 'invalid_json', message: 'Update URL did not return JSON', rawSnippet: snippet, suggestion };
    }
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

// Generic open-external handler so renderers can request the main process to open URLs (safer)
ipcMain.handle('open-external', async (event, url) => {
  try {
    if (!url) return { ok: false, error: 'no_url' };
    // Try normal open
    const res = await shell.openExternal(url);
    // shell.openExternal may return false on some platforms/clients — attempt Windows fallback for mailto
    if ((res === false || res === 0) && process.platform === 'win32' && String(url).startsWith('mailto:')) {
      try {
        const { exec } = require('child_process');
        // Use cmd start to delegate to default mail client (works when shell.openExternal silently fails)
        const safe = String(url).replace(/"/g, '\\"');
        exec(`cmd /c start "" "${safe}"`, (err) => { if (err) console.error('open-external fallback exec error', err); });
        return { ok: true, fallback: true };
      } catch (e2) {
        console.error('open-external fallback error', e2);
        return { ok: false, error: e2 && e2.message ? e2.message : String(e2) };
      }
    }
    return { ok: true };
  } catch (e) {
    console.error('open-external', e);
    // On Windows try cmd fallback for mailto specifically
    try {
      if (process.platform === 'win32' && String(url).startsWith('mailto:')) {
        const { execSync } = require('child_process');
        const safe = String(url).replace(/"/g, '\\"');
        execSync(`cmd /c start "" "${safe}"`);
        return { ok: true, fallback: true };
      }
    } catch (e2) {
      console.error('open-external fallback sync error', e2);
      return { ok: false, error: e2 && e2.message ? e2.message : String(e2) };
    }
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
});

// Create an Outlook compose window with HTML body on Windows using PowerShell + COM
ipcMain.handle('create-outlook-mail-html', async (event, args) => {
  try {
    if (process.platform !== 'win32') return { ok: false, error: 'not_windows' };
    const { html, subject, to } = args || {};
    if (!html) return { ok: false, error: 'no_html' };

    // Build PowerShell script to create an Outlook mail item with HTMLBody
    const safeSubject = String(subject || '').replace(/"/g, '""');
    const safeTo = String(to || '');
    const psScript = `try {
  $ol = New-Object -ComObject Outlook.Application
  $mail = $ol.CreateItem(0)
  $mail.To = "${safeTo}"
  $mail.Subject = "${safeSubject}"
  $mail.HTMLBody = @'
${html}
'@
  $mail.Display()
} catch { Write-Error $_ }
`;

    const tmp = path.join(os.tmpdir(), `extjt_mail_${Date.now()}.ps1`);
    // Write with BOM to help PowerShell interpret UTF-8 properly
    fs.writeFileSync(tmp, '\uFEFF' + psScript, 'utf8');
    // Execute asynchronously so UI is not blocked; remove tmp after spawn
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmp}"`, (err) => {
      try { fs.unlinkSync(tmp); } catch (e) {}
      if (err) console.error('create-outlook-mail-html exec error', err);
    });
    return { ok: true };
  } catch (e) {
    console.error('create-outlook-mail-html', e);
    return { ok: false, error: e && e.message ? e.message : String(e) };
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

  // If we have a project-local PJE storage (for testing), seed the user's appData on first run so automation can reuse it immediately
  try {
    const localPje = path.join(__dirname, 'playwright-storage', 'pje.json');
    const userPjeDir = path.join(app.getPath('userData'), 'playwright-storage');
    const userPje = path.join(userPjeDir, 'pje.json');
    if (fs.existsSync(localPje) && !fs.existsSync(userPje)) {
      try {
        if (!fs.existsSync(userPjeDir)) fs.mkdirSync(userPjeDir, { recursive: true });
        fs.copyFileSync(localPje, userPje);
        console.log('Seeded userData PJE storage from project copy');
      } catch (e) { console.error('Error seeding userData PJE storage', e); }
    }
  } catch (e) { /* ignore */ }

  // check auto-update on startup if enabled (opt-in)
  (async () => {
    try {
      const state = readStateFile();
      const updateCfg = (state.update && state.update) || {};
      const updateServer = updateCfg.updateServer || (require(path.join(__dirname, 'package.json')).updateServer) || null;
      if (updateCfg.autoUpdate && updateServer) {
        try {
          const meta = await fetchJson(updateServer);
          if (!meta || meta.__raw) return; // ignore invalid or non-JSON meta when auto-checking
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
