const { chromium } = require('playwright-core');
const sharepoint = (() => { try { return require('./src/sharepoint_service'); } catch (e) { return require('./sharepoint_service'); } })();
const path = require('path');
const fs = require('fs');
const { BrowserWindow, ipcMain } = require('electron');

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
async function tryFillEmail(page, email, sender = null, timeoutMs = 15000) {
    const selectors = ['input#i0116', 'input[name="loginfmt"]', 'input[type="email"]', 'input[name="login"]', 'input[aria-label*="Email"]'];
    const submitSelectors = ['#idSIButton9', 'button:has-text("Next")', 'button:has-text("Próximo")', 'input[type="submit"]', 'button[type="submit"]'];
    const end = Date.now() + (timeoutMs || 15000);
    while (Date.now() < end) {
        try {
            const frames = [page, ...page.frames()];
            for (const f of frames) {
                try {
                    for (const s of selectors) {
                        const el = await f.$(s);
                        if (!el) continue;
                        let filled = false;
                        // Try normal fill
                        try { await el.fill(email); filled = true; } catch (e) { /* continue */ }
                        // Fallback: use evaluate to set value and dispatch events
                        if (!filled) {
                            try {
                                await f.evaluate((sel, val) => {
                                    const e = document.querySelector(sel);
                                    if (e) {
                                        e.value = val;
                                        e.dispatchEvent(new Event('input', { bubbles: true }));
                                        e.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                }, s, email);
                                filled = true;
                            } catch (ee) { /* ignore */ }
                        }

                        if (filled) {
                            // Try to submit via known MS button or pressing Enter
                            try { await el.press('Enter'); } catch (e) {}
                            for (const ss of submitSelectors) {
                                try {
                                    const btn = await f.$(ss);
                                    if (btn) { try { await btn.click(); } catch(e){} }
                                } catch (ee) { /* ignore */ }
                            }

                            if (sender) sender.send('log-message', { type: 'info', msg: `Campo de e-mail preenchido automaticamente (${s})`, tech: 'tryFillEmail' });
                            await page.waitForTimeout(1200);
                            return true;
                        }
                    }
                } catch (e) { /* ignore frame errors */ }
            }
        } catch (e) { /* ignore */ }
        await page.waitForTimeout(800);
    }
    throw new Error('email_input_not_found');
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

        sharepoint.attachPopupFocusHandler(page, sender);

        const ok = await sharepoint.openOficiosRoot(page, args.url || null, sender);
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        // If an email credential was supplied, attempt to auto-fill the email on login pages
        let autoFillAttempted = false;
        let autoFilled = false;
        if (args && args.email) {
            autoFillAttempted = true;
            sender.send('log-message', { type: 'info', msg: `Tentando preencher email de login: ${args.email}`, tech: 'sharepoint.startSession' });
            try {
                const ok = await tryFillEmail(page, args.email, sender, typeof args.loginTimeoutMs === 'number' ? Math.min(args.loginTimeoutMs, 20000) : 15000);
                if (ok) {
                    autoFilled = true;
                    sender.send('log-message', { type: 'info', msg: `Preenchimento automático do email concluído (campo detectado e preenchido).`, tech: 'sharepoint.startSession' });
                }
            } catch (err) {
                sender.send('log-message', { type: 'warn', msg: `Preenchimento automático do email falhou ou não encontrado: ${err && err.message ? err.message : String(err)}`, tech: 'sharepoint.startSession' });
            }
        }

        // Wait until SharePoint content is available or user completes login
        const WAIT_TIMEOUT = typeof args.loginTimeoutMs === 'number' ? args.loginTimeoutMs : (8 * 60 * 1000); // default 8 min
        const POLL_INTERVAL = 1500;
        let list = null;
        let rootNotFoundCount = 0;
        let loginNotified = false;
        const startTime = Date.now();

        // Reserve a session id early so UI can reference it for login confirmation/cancel
        const sessionId = makeSessionId();
        sessions.set(sessionId, { browser, page, context, createdAt: Date.now(), capturedRequests: [] });
        // Keep session open longer (60 minutes) so user has time to inspect/complete actions
        _scheduleAutoClose(sessionId, 60 * 60 * 1000);
        sender.send('log-message', { type: 'info', msg: `Sessão (pré) reservada: ${sessionId}`, tech: 'sharepoint.startSession' });

        while (Date.now() - startTime < WAIT_TIMEOUT) {
            try {
                list = await sharepoint.listChildrenOfOficios(page, args.selector || null, sender);
                // If the evaluator couldn't find the root twice in a row, assume the target folder is present but empty (avoid infinite loop)
                if (list && (!list.ok && list.error === 'root_not_found')) {
                    rootNotFoundCount++;
                    sender.send('log-message', { type: 'warn', msg: `listChildrenOfOficios root_not_found (consecutive=${rootNotFoundCount})`, tech: 'sharepoint.startSession' });
                    if (rootNotFoundCount >= 2) {
                        sender.send('log-message', { type: 'info', msg: 'Assumindo pasta vazia após múltiplas tentativas; prosseguindo com preview vazio.', tech: 'sharepoint.startSession' });
                        // Treat as valid empty list so UI shows empty preview
                        list = { ok: true, items: [], rootText: '', containerSelector: '' };
                        break;
                    }
                } else {
                    // Reset counter when we have any other result (including valid empty array)
                    rootNotFoundCount = 0;
                }

                // Accept valid list even if empty: treat empty folder as valid content (avoid infinite loop)
                if (list && list.ok && Array.isArray(list.items)) {
                    // Found content (may be empty)
                    if (loginNotified) {
                        sender.send('log-message', { type: 'info', msg: `Login detectado (URL atual: ${page.url()})`, tech: 'sharepoint.startSession' });
                        sender.send('sharepoint:login-completed', { url: page.url() });
                    }
                    break;
                }
            } catch (e) {
                // ignore, page might still be loading or in redirect
            }

            // Check URL/frame for login page
            try {
                const cur = page.url() || '';
                const frames = page.frames() || [];
                const frameHasLogin = frames.some(f => { try { return (f.url() || '').includes('login.microsoftonline.com'); } catch(e){ return false; } });
                if ((cur && cur.includes('login.microsoftonline.com')) || frameHasLogin) {
                    if (!loginNotified) {
                        loginNotified = true;
                        // If an email credential was provided, do not prompt the user; attempt autofill (again) and wait for redirection
                        if (args && args.email) {
                            sender.send('log-message', { type: 'info', msg: 'Página de login detectada; credencial fornecida — tentando preenchimento automático e aguardando redirecionamento.', tech: 'sharepoint.startSession' });
                            // Try autofill again if not already successful
                            if (!autoFilled) {
                                try {
                                    const ok2 = await tryFillEmail(page, args.email, sender, 8000).catch(() => false);
                                    if (ok2) {
                                        autoFilled = true;
                                        sender.send('log-message', { type: 'info', msg: 'Autofill bem-sucedido na detecção da página de login.', tech: 'sharepoint.startSession' });
                                    } else {
                                        sender.send('log-message', { type: 'warn', msg: 'Autofill não encontrou o campo na segunda tentativa.', tech: 'sharepoint.startSession' });
                                    }
                                } catch (ee) {
                                    sender.send('log-message', { type: 'warn', msg: `Autofill falhou na segunda tentativa: ${ee && ee.message ? ee.message : String(ee)}`, tech: 'sharepoint.startSession' });
                                }
                            }
                            // Do NOT send any UI prompt (waiting/request) — continue polling for content until timeout
                        } else {
                            sender.send('log-message', { type: 'info', msg: 'Página de login detectada. Aguardando usuário realizar login...', tech: 'sharepoint.startSession' });
                            sender.send('sharepoint:waiting-for-login', { url: cur, sessionId });
                            sender.send('sharepoint:request-login', { sessionId });

                            // Wait for user's confirmation or cancellation via ipcMain event
                            const waitForUserAction = () => new Promise(resolve => {
                                const handler = (event, arg) => {
                                    // Ensure the response comes from the same renderer that asked
                                    try {
                                        if (event && event.sender && event.sender === webContents && arg && arg.sessionId === sessionId) {
                                            resolve(arg.action);
                                        }
                                    } catch (e) { /* ignore */ }
                                };
                                ipcMain.on('sharepoint:login-action', handler);

                                // Also auto-resolve after remaining timeout
                                const remaining = Math.max(0, WAIT_TIMEOUT - (Date.now() - startTime));
                                const timer = setTimeout(() => { ipcMain.removeListener('sharepoint:login-action', handler); resolve('timeout'); }, remaining);
                            });

                            const action = await waitForUserAction();
                            if (action === 'cancel' || action === 'timeout') {
                                throw new Error(action === 'cancel' ? 'Usuário cancelou login' : 'Tempo esgotado aguardando confirmação de login');
                            }
                            // if action === 'done' continue; loop will retry detection
                        }
                    }
                }
            } catch (e) { /* ignore */ }

            await page.waitForTimeout(POLL_INTERVAL);
        }

        if (!list || !list.ok) {
            throw new Error('Falha ao detectar conteúdo do SharePoint dentro do tempo esperado');
        }

        sender.send('log-message', { type: 'info', msg: `Sessão iniciada: ${sessionId}`, tech: 'sharepoint.startSession' });

        // Analyzer/capture removed — no network capture attached

        // Make preview serializable as before
        let safePreview = null;
        try { JSON.stringify(list); safePreview = list; }
        catch (e) {
            safePreview = {
                rootText: list && list.rootText ? list.rootText : '',
                containerSelector: list && list.containerSelector ? list.containerSelector : '',
                totalItems: Array.isArray(list && list.items) ? list.items.length : 0,
                folders: Array.isArray(list && list.items) ? (list.items.filter(i => i && i.isFolder).map(i => ({ name: i.name || '', selector: i.selector || '' }))) : []
            };
            sender.send('log-message', { type: 'warn', msg: 'Preview contained unserializable values; sent compact summary instead.', tech: 'sharepoint.startSession' });
        }

        // Compute suggested count (simple heuristic)
        const totalItems = Array.isArray(list && list.items) ? list.items.length : (list && list.totalItems ? list.totalItems : 0);
        const suggested = Math.max(1, Math.min(10, Math.floor(Math.max(3, 20 - totalItems))));

        // Prompt renderer to ask the user how many to create (only after browser is open and preview obtained)
        try {
            // Bring the app window to front so the user sees the confirmation popup
            try { sender.send('bring-window-front'); } catch (e) { /* ignore */ }
            sender.send('sharepoint:prompt-create', { sessionId, preview: safePreview, suggested });
        } catch (e) { /* ignore */ }

        return { ok: true, sessionId, preview: safePreview };
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
            resp = await sharepoint.createSequentialFolders(s.page, args.selector || null, count, options, sender, null);
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
        sharepoint.attachPopupFocusHandler(page, sender);

        // open root
        const ok = await sharepoint.openOficiosRoot(page, args.url || null, sender);
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        // wait a bit for dynamic content
        await page.waitForTimeout(2000);

        const list = await sharepoint.listChildrenOfOficios(page, args.selector || null, sender);
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

        sharepoint.attachPopupFocusHandler(page, sender);

        const ok = await sharepoint.openOficiosRoot(page, args.url || null, sender);
        if (!ok) throw new Error('Falha ao navegar para OFÍCIOS root');

        await page.waitForTimeout(2000);

        // Call createSequentialFolders with provided count and options
        const count = typeof args.count === 'number' ? args.count : null;
        const options = { prefix: args.prefix || 'OFICIO ' };

        const resp = await sharepoint.createSequentialFolders(page, args.selector || null, count, options, sender, null);

        sender.send('log-message', { type: 'info', msg: `Criação finalizada. Resultado: ${JSON.stringify(resp)}`, tech: 'sharepoint.create' });

        return resp;
    } catch (e) {
        return { ok: false, error: e && e.message ? e.message : String(e) };
    } finally {
        try { if (browser) await browser.close(); } catch(e){}
    }
}

module.exports = { getPreview, createSequential, startSession, createInSession, cancelSession };
