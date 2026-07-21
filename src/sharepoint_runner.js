const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const { BrowserWindow, ipcMain } = require('electron');

let _sharepoint = null;
function getSharepoint() {
    if (!_sharepoint) {
        try { _sharepoint = require('./sharepoint_service'); } catch (e) { _sharepoint = null; }
    }
    return _sharepoint;
}

// Utility to find Edge executable on Windows
function findEdgeExec() {
    const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    return paths.find(p => fs.existsSync(p));
}

// Wraps a webContents so sharepoint_service can send logs and bring-window-front
function makeEventSender(webContents) {
    return {
        send: (channel, payload) => {
            if (channel === 'bring-window-front') {
                try {
                    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
                    if (win) {
                        win.setAlwaysOnTop(true, 'screen');
                        setTimeout(() => { try { win.setAlwaysOnTop(false); if (!win.isDestroyed()) win.focus(); } catch(e){} }, 300);
                    }
                } catch (e) { /* ignore */ }
                return;
            }
            // Default: forward to renderer
            try { webContents.send(channel, payload); } catch(e) { /* ignore */ }
        }
    };
}

// Try to find an email input in the page/frames and fill it + submit 'Next' if possible.
async function tryFillEmail(page, email, sender = null, timeoutMs = 30000) {
    const selectors = [
        'input#i0116',
        'input[name="loginfmt"]',
        'input[type="email"]',
        'input[aria-label*="Email"]',
        'input[aria-label*="e-mail"]',
        'input[aria-label*="Conta"]',
        'input[placeholder*="Email"]',
        'input[placeholder*="e-mail"]',
        'input[placeholder*="Conta"]',
    ];

    // Wait for any of the selectors to appear
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const frames = [page, ...page.frames()];
            for (const f of frames) {
                try {
                    const url = await f.url().catch(() => '');
                    if (!url.includes('login.microsoftonline.com') && !url.includes('login.live.com')) continue;
                } catch(e) { continue; }

                for (const s of selectors) {
                    try {
                        const el = await f.waitForSelector(s, { timeout: 3000, state: 'visible' });
                        if (!el) continue;
                        
                        // Clear and fill
                        await el.click();
                        await el.fill('');
                        await el.type(email, { delay: 30 });
                        
                        // Try to click "Next" / "Próximo" / "Enter"
                        try {
                            const nextBtn = await f.waitForSelector('#idSIButton9, button:has-text("Próximo"), button:has-text("Next"), input[type="submit"]', { timeout: 2000 });
                            if (nextBtn) await nextBtn.click();
                        } catch(e) {
                            // Fallback: press Enter
                            try { await el.press('Enter'); } catch(ee) {}
                        }

                        if (sender) sender.send('log-message', { type: 'info', msg: `Email ${email} preenchido automaticamente.`, tech: 'tryFillEmail' });
                        await page.waitForTimeout(2000);
                        return true;
                    } catch(e) { /* continue to next selector */ }
                }
            }
        } catch(e) { /* ignore */ }
        await page.waitForTimeout(800);
    }
    
    if (sender) sender.send('log-message', { type: 'warn', msg: 'Não foi possível preencher o email automaticamente. Faça manualmente.', tech: 'tryFillEmail' });
    return false;
}

async function launchBrowser(edgeExe, webContents) {
    const edgePath = edgeExe || findEdgeExec();
    if (!edgePath) throw new Error('Edge executable not found');

    const browser = await chromium.launch({ executablePath: edgePath, headless: false, args: ['--start-maximized', '--disable-blink-features=AutomationControlled'] });
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    return { browser, context, page };
}

// Session management: we can start a session that keeps the browser open
const sessions = new Map(); // sessionId -> { browser, context, page, timer }
function makeSessionId() {
    return Math.random().toString(36).slice(2, 10);
}

function _scheduleAutoClose(sessionId, ttl = 10 * 60 * 1000) {
    const s = sessions.get(sessionId);
    if (!s) return;
    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(async () => {
        try {
            if (s.browser) await s.browser.close();
        } catch (e) { /* ignore */ }
        sessions.delete(sessionId);
    }, ttl);
}

// Note: analyzer/capture functionality removed — session stores only browser/context/page.

async function startSession(args = {}, webContents) {
    const sender = makeEventSender(webContents);
    let browser, page, context;
    try {
        sender.send('log-message', { type: 'info', msg: 'Iniciando navegador (sessão) para SharePoint...', tech: 'sharepoint.startSession' });
        const res = await launchBrowser(null, webContents);
        browser = res.browser; context = res.context; page = res.page;

        getSharepoint()?.attachPopupFocusHandler(page, sender);

        const ok = await getSharepoint()?.openOficiosRoot(page, args.url || null, sender);
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        const sessionId = makeSessionId();
        sessions.set(sessionId, { browser, page, context, createdAt: Date.now(), capturedRequests: [] });
        _scheduleAutoClose(sessionId, 60 * 60 * 1000);
        sender.send('log-message', { type: 'info', msg: `Sessão reservada: ${sessionId}`, tech: 'sharepoint.startSession' });

        let email = args && args.email ? args.email.trim() : null;
        let autoFilled = false;
        const WAIT_TIMEOUT = 8 * 60 * 1000;
        const startTime = Date.now();

        // Wait loop until we land on SharePoint
        while (Date.now() - startTime < WAIT_TIMEOUT) {
            try {
                const cur = page.url() || '';
                const isOnLogin = cur.includes('login.microsoftonline.com') || cur.includes('login.live.com') || cur.includes('login.windows.net');
                const isOnSharePoint = cur.includes('sharepoint.com');

                if (isOnSharePoint) {
                    sender.send('log-message', { type: 'info', msg: 'Navegador redirecionou para SharePoint com sucesso.', tech: 'sharepoint.startSession' });
                    break;
                }

                if (isOnLogin && email && !autoFilled) {
                    sender.send('log-message', { type: 'info', msg: 'Página de login detectada. Preenchendo email automaticamente...', tech: 'sharepoint.startSession' });
                    const filled = await tryFillEmail(page, email, sender, 20000);
                    if (filled) {
                        autoFilled = true;
                        sender.send('log-message', { type: 'info', msg: 'Email preenchido. Aguardando senha e redirecionamento...', tech: 'sharepoint.startSession' });
                    }
                }

                if (isOnLogin && !email) {
                    sender.send('sharepoint:waiting-for-login', { url: cur, sessionId });

                    // Wait for user to provide email via the modal
                    const result = await new Promise(resolve => {
                        const handler = (event, arg) => {
                            try {
                                if (event && event.sender && event.sender === webContents && arg && arg.sessionId === sessionId) {
                                    resolve(arg);
                                }
                            } catch (e) { /* ignore */ }
                        };
                        ipcMain.on('sharepoint:login-action', handler);
                        const remaining = Math.max(0, WAIT_TIMEOUT - (Date.now() - startTime));
                        setTimeout(() => { ipcMain.removeListener('sharepoint:login-action', handler); resolve({ action: 'timeout' }); }, remaining);
                    });

                    if (result.action === 'cancel' || result.action === 'timeout') {
                        throw new Error(result.action === 'cancel' ? 'Usuário cancelou' : 'Tempo esgotado');
                    }

                    // User provided email through the modal
                    if (result.email) {
                        email = result.email;
                        sender.send('log-message', { type: 'info', msg: `Email: ${email}. Preenchendo automaticamente...`, tech: 'sharepoint.startSession' });
                        sender.send('sharepoint:login-waiting', { sessionId });
                        const filled = await tryFillEmail(page, email, sender, 20000);
                        if (filled) {
                            autoFilled = true;
                            sender.send('log-message', { type: 'info', msg: 'Email preenchido com sucesso.', tech: 'sharepoint.startSession' });
                        }
                    }
                }
            } catch (e) {
                // Re-throw known errors, ignore others
                if (e.message && (e.message.includes('cancelou') || e.message.includes('esgotado'))) throw e;
            }
            await page.waitForTimeout(1500);
        }

        // Final check
        try {
            const finalUrl = page.url() || '';
            if (finalUrl.includes('login.microsoftonline.com') || finalUrl.includes('login.live.com')) {
                throw new Error('Login não foi concluído dentro do tempo esperado');
            }
        } catch (e) {
            if (e.message.includes('Login não foi concluído')) throw e;
        }

        sender.send('log-message', { type: 'info', msg: 'Navegador pronto. Solicitando quantidade de pastas...', tech: 'sharepoint.startSession' });

        // Prompt user for how many folders to create (skip preview/list detection)
        try {
            try { sender.send('bring-window-front'); } catch (e) { /* ignore */ }
            sender.send('sharepoint:prompt-create', { sessionId });
        } catch (e) { /* ignore */ }

        return { ok: true, sessionId, preview: null };
    } catch (e) {
        const errMsg = e && e.message ? e.message : String(e);
        const errStack = e && e.stack ? e.stack : null;
        const ts = Date.now();
        const screenshotPath = path.join(process.cwd(), `sharepoint_session_error_${ts}.png`);
        const htmlPath = path.join(process.cwd(), `sharepoint_session_error_${ts}.html`);
        try { if (page) await page.screenshot({ path: screenshotPath }); } catch(_){ }
        try { if (page) {
            const html = await page.content().catch(() => null);
            if (html) fs.writeFileSync(htmlPath, html, 'utf8');
        } } catch(_){ }
        try { if (browser) await browser.close(); } catch(_){ }
        // Cleanup reserved session if exists
        try { if (typeof sessionId !== 'undefined') sessions.delete(sessionId); } catch(_){ }

        try { sender.send('log-message', { type: 'error', msg: `startSession error: ${errMsg}`, tech: 'sharepoint.startSession', details: { stack: errStack, screenshot: screenshotPath, html: htmlPath } }); } catch (_){ }

        return { ok: false, error: errMsg, details: { stack: errStack, screenshot: screenshotPath, html: htmlPath } };
    }
}

async function createInSession(sessionId, args = {}, webContents) {
    const sender = makeEventSender(webContents);
    const s = sessions.get(sessionId);
    if (!s) return { ok: false, error: 'Sessão não encontrada ou já finalizada' };

    // Log session URL for troubleshooting
    try {
        const curUrl = (s && s.page && typeof s.page.url === 'function') ? s.page.url() : 'unknown';
        sender.send('log-message', { type: 'info', msg: `Sessão encontrada: ${sessionId} (URL atual: ${curUrl})`, tech: 'sharepoint.createInSession' });
    } catch (e) { /* ignore */ }

    // refresh timeout while working
    _scheduleAutoClose(sessionId);

    try {
        sender.send('log-message', { type: 'info', msg: `Iniciando criação de pastas na sessão ${sessionId}...`, tech: 'sharepoint.createInSession' });

        const count = typeof args.count === 'number' ? args.count : null;
        // Default to numeric-only names (no textual prefix) unless user provided one
        const options = { prefix: (typeof args.prefix === 'string' ? args.prefix : ''), restBasePath: args && args.restBasePath ? args.restBasePath : null };

        let resp;
        try {
            const sp = getSharepoint();
            resp = sp ? await sp.createSequentialFolders(s.page, args.selector || null, count, options, sender, null) : { ok: false, error: 'sharepoint_service_unavailable' };
        } catch (e) {
            resp = { ok: false, error: e && e.message ? e.message : String(e) };
        }

        // If creation failed due to root_not_found, keep the browser open for debugging instead of closing immediately
        if (resp && resp.ok === false && resp.error === 'root_not_found') {
            try { sender.send('log-message', { type: 'warn', msg: `createInSession: creation failed with root_not_found; keeping session ${sessionId} open for inspection.`, tech: 'sharepoint.createInSession' }); } catch(e){}
            // extend auto-close to 30 minutes
            try { _scheduleAutoClose(sessionId, 30 * 60 * 1000); } catch(e){}
            return { ok: false, error: resp.error, sessionKept: true, sessionId };
        }

        // close browser and cleanup for other outcomes
        try { if (s.browser) await s.browser.close(); } catch (e) { sender.send('log-message', { type: 'warn', msg: 'Erro ao fechar o navegador: ' + (e.message||e), tech: 'sharepoint.createInSession' }); }
        sessions.delete(sessionId);

        sender.send('log-message', { type: 'info', msg: `Criação finalizada (sessão ${sessionId}).`, tech: 'sharepoint.createInSession' });

        return { ok: true, result: resp };
    } catch (e) {
        const errMsg = e && e.message ? e.message : String(e);
        // Capture screenshot for debugging
        const ts = Date.now();
        const screenshotPath = path.join(process.cwd(), `sharepoint_create_error_${sessionId}_${ts}.png`);
        const htmlPath = path.join(process.cwd(), `sharepoint_create_error_${sessionId}_${ts}.html`);
        try { if (s && s.page) await s.page.screenshot({ path: screenshotPath }); } catch(_){ }
        try { if (s && s.page) {
            const html = await s.page.content().catch(() => null);
            if (html) fs.writeFileSync(htmlPath, html, 'utf8');
        } } catch(_){ }
        // Keep session/browser open so user can inspect; extend auto-close to 30 minutes
        try { _scheduleAutoClose(sessionId, 30 * 60 * 1000); } catch(_){ }
        try { sender.send('log-message', { type: 'error', msg: `Erro durante criação; sessão ${sessionId} mantida aberta para depuração. Use 'Cancelar sessão' para fechar. Erro: ${errMsg}`, tech: 'sharepoint.createInSession', details: { screenshot: screenshotPath, html: htmlPath, stack: e && e.stack ? e.stack : null } }); } catch(_){ }
        return { ok: false, error: errMsg, sessionKept: true, sessionId, details: { screenshot: screenshotPath, html: htmlPath, stack: e && e.stack ? e.stack : null } };
    }
}

async function cancelSession(sessionId) {
    try {
        const s = sessions.get(sessionId);
        if (!s) return { ok: false, error: 'session_not_found' };
        try {
            // Signal page scripts to cancel any ongoing creation work before closing
            try { if (s.page) await s.page.evaluate(() => { window.__extrajud_creation_cancelled = true; }); } catch(e) {}
            if (s.browser) await s.browser.close();
        } catch(e){}
        sessions.delete(sessionId);
        return { ok: true };
    } catch (e) { return { ok: false, error: e && e.message ? e.message : String(e) }; }
}

async function getPreview(args = {}, webContents) {
    const sender = makeEventSender(webContents);
    let browser, page;
    try {
        sender.send('log-message', { type: 'info', msg: 'Iniciando navegador para obter preview...', tech: 'sharepoint.getPreview' });
        const res = await launchBrowser(null, webContents);
        browser = res.browser; page = res.page;

        // attach popup focus handlers
        getSharepoint()?.attachPopupFocusHandler(page, sender);

        // open root
        const sp = getSharepoint();
        const ok = sp ? await sp.openOficiosRoot(page, args.url || null, sender) : false;
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        // wait a bit for dynamic content
        await page.waitForTimeout(2000);

        const list = sp ? await sp.listChildrenOfOficios(page, args.selector || null, sender) : { items: [] };
        sender.send('log-message', { type: 'info', msg: `Preview obtido: ${list.items ? list.items.length : 0} itens.`, tech: 'sharepoint.getPreview' });

        // Ensure the preview is JSON-serializable for IPC transport. If not, build a safe summary.
        let safePreview = null;
        try {
            // Try to stringify; if it fails, we'll fall back
            JSON.stringify(list);
            safePreview = list;
        } catch (e) {
            // Build a compact serializable summary
            safePreview = {
                rootText: list && list.rootText ? list.rootText : '',
                containerSelector: list && list.containerSelector ? list.containerSelector : '',
                totalItems: Array.isArray(list && list.items) ? list.items.length : 0,
                folders: Array.isArray(list && list.items) ? (list.items.filter(i => i && i.isFolder).map(i => ({ name: i.name || '', selector: i.selector || '' }))) : []
            };
            sender.send('log-message', { type: 'warn', msg: 'Preview contained unserializable values; sent compact summary instead.', tech: 'sharepoint.getPreview' });
        }

        return { ok: true, preview: safePreview };
    } catch (e) {
        try { if (page) await page.screenshot({ path: path.join(process.cwd(), 'sharepoint_preview_error.png') }); } catch(_){}
        return { ok: false, error: e && e.message ? e.message : String(e) };
    } finally {
        try { if (browser) await browser.close(); } catch(e){}
    }
}

async function createSequential(args = {}, webContents) {
    const sender = makeEventSender(webContents);
    let browser, page;
    try {
        sender.send('log-message', { type: 'info', msg: 'Iniciando criação de pastas no SharePoint...', tech: 'sharepoint.create' });
        const res = await launchBrowser(null, webContents);
        browser = res.browser; page = res.page;

        getSharepoint()?.attachPopupFocusHandler(page, sender);

        const sp = getSharepoint();
        const ok = sp ? await sp.openOficiosRoot(page, args.url || null, sender) : false;
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        await page.waitForTimeout(2000);

        // Call createSequentialFolders with provided count and options
        const count = typeof args.count === 'number' ? args.count : null;
        const options = { prefix: args.prefix || 'OFICIO ' };

        const resp = sp ? await sp.createSequentialFolders(page, args.selector || null, count, options, sender, null) : { ok: false, error: 'sharepoint_service_unavailable' };

        sender.send('log-message', { type: 'info', msg: `Criação finalizada. Resultado: ${JSON.stringify(resp)}`, tech: 'sharepoint.create' });

        return resp;
    } catch (e) {
        return { ok: false, error: e && e.message ? e.message : String(e) };
    } finally {
        try { if (browser) await browser.close(); } catch(e){}
    }
}

module.exports = { getPreview, createSequential, startSession, createInSession, cancelSession };
