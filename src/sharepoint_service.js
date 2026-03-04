/*
  sharepoint_service.js
  Serviço modular para interagir com SharePoint via Playwright (heurístico).
  - scanDocumentFolders(page, eventSender): varre frames e extrai possíveis pastas dentro de "Documentos" e retorna array.
  - attachPopupFocusHandler(page, eventSender): quando dialogs/popups aparecem, envia evento para trazer janela do app à frente.
  - createFolders(page, baseFolderNameOrSelector, names, eventSender): tentativa robusta de criar múltiplas pastas em um diretório selecionado.

  Observação: este é um esqueleto robusto e defensivo; seletores reais deverão ser ajustados com base na saída do snippet DevTools (arquivo devtools_extract_sharepoint.js).
*/

const DEFAULT_WAIT = 4000;

/**
 * Heurística para varrer um frame/documento e listar elementos que aparentam ser pastas.
 * Retorna array de { name, href, title, ariaLabel, dataset, pathHint, frameUrl }
 */
async function scanDocumentFolders(page, eventSender = null) {
    const frames = [page, ...page.frames()];
    const results = [];

    for (const frame of frames) {
        try {
            const frag = await frame.evaluate(() => {
                const out = { frameUrl: location.href, found: [] };

                const textOf = (el) => (el && el.innerText) ? el.innerText.trim() : '';

                // Candidates selectors commonly seen in modern SharePoint/OneDrive views
                const candidateSelectors = [
                    'a', 'button', 'span', 'div' // broad - we'll filter by heuristics
                ];

                // Gather candidate elements
                const candidates = [];
                candidateSelectors.forEach(s => {
                    Array.from(document.querySelectorAll(s)).forEach(el => candidates.push(el));
                });

                // Heuristics: an element is a folder candidate if:
                // - text length between 3 and 80 and not just numbers
                // - contains attributes like title, aria-label, href
                // - or classnames containing 'folder' or 'ms-Folder' or 'document-library'
                const isLikelyFolder = (el) => {
                    const txt = textOf(el);
                    if (!txt || txt.length < 2 || txt.length > 200) return false;
                    if (/^\d+$/.test(txt)) return false;
                    const cls = (el.className || '').toLowerCase();
                    const title = (el.getAttribute && el.getAttribute('title')) || '';
                    const aria = (el.getAttribute && el.getAttribute('aria-label')) || '';

                    if (/folder|pasta|document-library|c-folder|ms-Folder|od-Folder/i.test(cls)) return true;
                    if (/folder|pasta/i.test(title)) return true;
                    if (/folder|pasta/i.test(aria)) return true;

                    // If it has role link or href and text, it's a candidate
                    if ((el.tagName === 'A' || el.getAttribute && el.getAttribute('role') === 'link' || el.getAttribute && el.getAttribute('href')) && txt) return true;

                    // Common UI: an element with a child <span> that has text and a preceding icon
                    const childSpan = el.querySelector && el.querySelector('span');
                    if (childSpan && textOf(childSpan)) return true;

                    return false;
                };

                // Try to find areas that indicate "Documentos" (a view/librarie)
                const docAnchors = Array.from(document.querySelectorAll('a, span, div, li')).filter(el => {
                    const t = textOf(el).toLowerCase();
                    return t.includes('documentos') || t.includes('documento') || t.includes('document library') || t.includes('documentos do site');
                });

                // If docAnchors present, limit search to their nearest container; else scan whole doc
                const searchRoots = docAnchors.length > 0 ? docAnchors.map(a => a.closest('div, section, main, article, ul') || document.body) : [document.body];

                const seen = new Set();
                searchRoots.forEach(root => {
                    const elems = Array.from(root.querySelectorAll('a,span,button,div'));
                    elems.forEach(el => {
                        if (isLikelyFolder(el)) {
                            const txt = textOf(el);
                            if (seen.has(txt)) return;
                            seen.add(txt);
                            out.found.push({
                                name: txt,
                                title: el.getAttribute && el.getAttribute('title'),
                                ariaLabel: el.getAttribute && el.getAttribute('aria-label'),
                                href: el.getAttribute && el.getAttribute('href'),
                                dataset: el.dataset || {},
                                pathHint: (() => {
                                    const crumb = el.closest('[role="navigation"], .breadcrumb, .ms-Breadcrumb') || el.closest('div[class*=breadcrumb]') || null;
                                    return crumb ? (crumb.innerText || '').trim().slice(0, 200) : null;
                                })()
                            });
                        }
                    });
                });

                // Additionally, scan for lists (ul/ol) of items if present
                Array.from(document.querySelectorAll('ul, ol')).forEach(list => {
                    const items = Array.from(list.querySelectorAll('li')).slice(0, 200);
                    items.forEach(it => {
                        const txt = textOf(it);
                        if (txt && txt.length > 1 && !/^\d+$/.test(txt)) {
                            if (!out.found.find(f => f.name === txt)) {
                                out.found.push({ name: txt, title: it.getAttribute('title'), ariaLabel: it.getAttribute && it.getAttribute('aria-label'), href: (it.querySelector && (it.querySelector('a') && it.querySelector('a').href)) || null, dataset: it.dataset || {}, pathHint: null });
                            }
                        }
                    });
                });

                return out;
            });

            // Post-process: keep only unique names and filter out tiny strings
            if (frag && frag.found && frag.found.length > 0) {
                frag.found.forEach(f => {
                    // Normalize name
                    const name = (f.name || '').trim();
                    if (!name || name.length < 2) return;
                    results.push(Object.assign({ frameUrl: frag.frameUrl }, f));
                });
            }
        } catch (e) {
            // Frame cross-origin or other error
            if (eventSender) eventSender.send('log-message', { type: 'warn', msg: `Frame inacessível: ${e.message}`, tech: 'scanDocumentFolders' });
        }
    }

    // Deduplicate by name
    const uniq = [];
    const seenNames = new Set();
    for (const r of results) {
        const key = r.name.toLowerCase();
        if (!seenNames.has(key)) { seenNames.add(key); uniq.push(r); }
    }

    // Mark those that start with OFÍCIOS
    uniq.forEach(u => u.isOficios = /^of[ií]cios\s*\d{4}/i.test(u.name));

    if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[SCAN_RESULT] Varredura completa. ${uniq.length} candidatos indexados (${uniq.filter(u=>u.isOficios).length} correspondem ao padrão 'OFÍCIOS').`, tech: 'FileSystem::ScanDocumentFolders' });

    return uniq;
}

/**
 * Attach handlers to bring application window to front when dialogs/popups show up.
 * It emits 'bring-window-front' via eventSender (main process should handle it and focus the BrowserWindow).
 */
function attachPopupFocusHandler(page, eventSender = null) {
    try {
        page.on('dialog', async dialog => {
            if (eventSender) eventSender.send('bring-window-front', { reason: 'dialog' });
            // Do not auto-dismiss - let caller handle the dialog. We will log.
            console.log('[SharePoint Service] [DIALOG_DETECT] Janela de diálogo nativa interceptada:', dialog.message());
        });

        page.on('popup', popup => {
            if (eventSender) eventSender.send('bring-window-front', { reason: 'popup' });
            console.log('[SharePoint Service] [POPUP_DETECT] Nova janela de popup detectada:', popup.url());
        });

        page.on('filechooser', fc => {
            if (eventSender) eventSender.send('bring-window-front', { reason: 'filechooser' });
            console.log('[SharePoint Service] [FILE_CHOOSER] Solicitação de upload de arquivo detectada.');
        });

    } catch (e) {
        console.warn('[SharePoint Service] [HANDLER_ERROR] Falha ao anexar listeners de eventos de UI:', e && e.message);
    }
}

/**
 * Navega diretamente para a pasta OFÍCIOS (URL fornecida pelo usuário/serviço)
 * Retorna true se a navegação ocorreu sem erro.
 */
async function openOficiosRoot(page, url, eventSender = null) {
    const DEFAULT_URL = "https://iberdrola.sharepoint.com/sites/JUDCOELBA/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FJUDCOELBA%2FShared%20Documents%2FCria%C3%A7%C3%A3o%20de%20Pastas&viewid=b0389131%2Db788%2D4354%2D8edd%2Dcfe27a229f93&ct=1720187493260&or=Teams%2DHL&LOF=1&ovuser=031a09bc%2Da2bf%2D44df%2D888e%2D4e09355b7a24%2Cjoao%2Eaviana%40neoenergia%2Ecom&OR=Teams%2DHL&CT=1769606129626&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiIxNDE1LzI2MDEwNDAwOTIzIiwiSGFzRmVkZXJhdGVkVXNlciI6ZmFsc2V9";
    let target = String(url || DEFAULT_URL);

    // Sanitize URL to avoid sending ephemeral tokens (keep only safe query params)
    try {
        const u = new URL(target);
        const allowed = ['id', 'viewid'];
        const qp = new URLSearchParams();
        for (const k of allowed) if (u.searchParams.has(k)) qp.set(k, u.searchParams.get(k));
        const clean = `${u.origin}${u.pathname}${qp.toString() ? ('?' + qp.toString()) : ''}`;
        if (clean !== target) {
            if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[URL_SANITIZE] Limpando tokens efêmeros da URL alvo. Target final: ${clean}`, tech: 'URL::Sanitization' });
            target = clean;
        }
    } catch (e) {
        // ignore URL parse errors and use original
    }

    try {
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[NAV_START] Iniciando navegação para raiz do SharePoint: ${target}`, tech: 'Page::Goto' });
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 90000 });
        // Pequeno delay para que frames e scripts carreguem
        await page.waitForTimeout(2500);
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[NAV_COMPLETE] Carga da página raiz concluída com sucesso.`, tech: 'Page::LoadEvent' });
        return true;
    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `[NAV_FAIL] Falha crítica de navegação: ${e && e.message}`, tech: 'Exception::Navigation' });
        return false;
    }
}

/**
 * Tentativa genérica de criar folders dentro de um diretório SharePoint.
 * baseFolderNameOrSelector: string - pode ser um nome de pasta (procura por correspondência) ou um selector CSS.
 * names: array of strings - nomes de pastas a criar (ordem)
 * Returns array of results [{name, ok, reason}]
 */
async function createFolders(page, baseFolderNameOrSelector, names = [], eventSender = null) {
    const results = [];

    // Helper: bring app to front before user intervenes
    if (eventSender) eventSender.send('bring-window-front', { reason: 'createFolders_start' });

    try {
        // Set an in-page creation flag so external cancelers can observe and stop the process
        try { await page.evaluate(() => { window.__extrajud_creation_in_progress = true; window.__extrajud_creation_cancelled = false; }); } catch(e) { /* ignore */ }
        // 1. Nav to base folder: try selector first, else search by name text
        let baseElHandle = null;

        if (baseFolderNameOrSelector && (baseFolderNameOrSelector.startsWith('.') || baseFolderNameOrSelector.startsWith('#') || baseFolderNameOrSelector.includes('['))) {
            try { baseElHandle = await page.$(baseFolderNameOrSelector); } catch (e) {}
        }

        if (!baseElHandle && baseFolderNameOrSelector) {
            // search by text in page & frames
            const name = baseFolderNameOrSelector.trim();
            const frames = [page, ...page.frames()];
            for (const f of frames) {
                try {
                    const handle = await f.$(`text="${name}"`) || await f.$(`xpath=//*[contains(normalize-space(.), "${name}")]`);
                    if (handle) { baseElHandle = handle; break; }
                } catch (e) {}
            }
        }

        if (!baseElHandle && baseFolderNameOrSelector) {
            throw new Error('[SELECTOR_ERROR] Pasta base não encontrada na árvore de elementos. Verifique seletores no DevTools.');
        }

        // --- BYPASS NAVIGATION (MARCH 2026) ---
        // Forçamos o robô a NUNCA clicar no breadcrumb ou em elementos de navegação inicial, 
        // pois a página já é aberta diretamente no diretório alvo pela função openOficiosRoot.
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: '[BASE_FOLDER] Operando diretamente no diretório ativo para evitar cliques fantasmas no breadcrumb.', tech: 'FileSystem::Context' });
        await page.waitForTimeout(1000);

        // 2. For each name: try to press "New" -> "Folder" buttons, fallback to keyboard shortcuts
        for (const name of names) {
            const res = { name, ok: false, reason: null };
            try {
                // Check cancellation flag before attempting each creation
                try {
                    const cancelled = await page.evaluate(() => !!window.__extrajud_creation_cancelled).catch(() => false);
                    if (cancelled) { res.reason = 'cancelled_by_user'; results.push(res); break; }
                } catch(e) {}
                
                // --- NEW UI ACTION FLOW (March 2026) ---
                // Targeted flow for the observed modern SharePoint DOM:
                // 1) Click toolbar 'Novo'/'Criar ou carregar' button
                // 2) Click menu item button[data-automationid="newFolderCommand"] (label: 'Pasta')
                // 3) Fill dialog input[data-automation-id="nameDialogTextField"] and click button[data-automation-id="Criar"].
                
                const uiResp = await createFolderUsingSiteButtons(page, name, eventSender);
                if (uiResp && uiResp.ok) {
                    res.ok = true;
                    res.reason = 'created_via_ui_flow';
                } else {
                    res.reason = uiResp && uiResp.error ? uiResp.error : 'ui_flow_failed';
                }

            } catch (e) {
                res.reason = e && e.message;
            }
            results.push(res);
        }

        // Clear in-page creation flag
        try { await page.evaluate(() => { window.__extrajud_creation_in_progress = false; }); } catch(e) { /* ignore */ }

    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `Erro createFolders: ${e.message}`, tech: 'createFolders' });
        results.push({ name: null, ok: false, reason: e.message });
    }

    return results;
}

/**
 * Lista os filhos (itens/pastas) do diretório Criação de Pastas encontrado na página.
 * oficiosSelectorOrText: seletor CSS da raiz ou texto parcial (ex: 'Criação de Pastas').
 * Retorna array de { name, isFolder, href, selector }
 */

async function listChildrenOfOficios(page, oficiosSelectorOrText = null, eventSender = null) {
    try {
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Procurando Criação de Pastas: ${oficiosSelectorOrText || '[auto]'}`, tech: 'listChildrenOfOficios' });

        const data = await page.evaluate(async (sel) => {
            function safeText(el){ try { return (el && el.innerText) ? el.innerText.trim() : ''; } catch(e){ return ''; } }
            function elementPath(el){ try { if(!el) return ''; const path=[]; let cur=el, depth=0; while(cur && cur.nodeType===1 && depth++<12){ let part=cur.tagName.toLowerCase(); if(cur.id) part += `#${cur.id}`; else if(cur.className) part += `.${(cur.className||'').toString().split(/\s+/).slice(0,3).join('.')}`; const sib = Array.from(cur.parentNode?cur.parentNode.children:[]).indexOf(cur)+1; part += `:nth-child(${sib})`; path.unshift(part); cur = cur.parentNode; } return path.join(' > '); } catch(e){ return ''; } }

            // Find root element by selector or by text (support both OFÍCIOS and 'Criação de Pastas')
            let rootEl = null;
            if (sel) rootEl = document.querySelector(sel);
            if (!rootEl) {
                rootEl = Array.from(document.querySelectorAll('div, section, header, main')).find(d => {
                    const txt = safeText(d) || '';
                    const low = txt.toLowerCase();
                    if (/OF[IÍ]CIOS\s*\d{4}/i.test(txt)) return true;
                    if (low.includes('cria') || low.includes('criação') || low.includes('cria%c3%a7') ) return true;
                    if (low.includes('criação de pastas') || low.includes('criaçao de pastas')) return true;
                    return false;
                });
            }
            if (!rootEl) return { ok:false, error: 'root_not_found' };

            // Find list container
            let anc = rootEl;
            for (let i=0;i<8 && anc; i++){
                if (anc.className && /(Files-main|Files-mainColumn|ms-Grid|listView|ms-List|list-content)/i.test(anc.className)) { break; }
                anc = anc.parentElement;
            }
            const potential = anc || document.body;
            const grid = potential.querySelector('[role="grid"], [role="table"], div.ms-List, table[role="grid"], div#list-content-id');
            const listContainer = grid || potential;

            // Try to expand lazy-loaded lists: detect a scrollable element and perform incremental scroll + wheel events
            try {
                let expandedAttempts = 0;
                let consecutiveNoChange = 0;
                function delay(ms){ return new Promise(res => setTimeout(res, ms)); }
                function currentRowCount(){ try { return (listContainer.querySelectorAll('[role="row"], [role="listitem"], .ms-List-cell, div[role="gridcell"], tr') || []).length; } catch(e){ return 0; } }

                function findScrollable(el){
                    try {
                        // Prefer descendants that are visibly scrollable
                        const descendants = Array.from(el.querySelectorAll('*'));
                        for (const d of [el].concat(descendants)) {
                            try {
                                const sh = d.scrollHeight || 0;
                                const ch = d.clientHeight || 0;
                                if (sh - ch > 60) return d;
                            } catch(_){}
                        }
                        // Fallback to ancestors
                        let anc = el;
                        while (anc) {
                            try { const sh = anc.scrollHeight || 0; const ch = anc.clientHeight || 0; if (sh - ch > 60) return anc; } catch(_){}
                            anc = anc.parentElement;
                        }
                    } catch(e){}
                    return null;
                }

                const initialHref = location.href;
                const scrollTarget = findScrollable(listContainer) || document.scrollingElement || document.documentElement || document.body;
                try { listContainer.__scrollTarget = elementPath(scrollTarget); } catch(e){}

                const maxAttempts = 80;
                let prevCount = currentRowCount();
                let expansionError = null;
                for (let i = 0; i < maxAttempts; i++) {
                    // Guard against navigation/context loss
                    if (location.href !== initialHref || document.hidden) { expansionError = 'navigation_or_hidden'; break; }

                    // Try step scroll and wheel event to stimulate virtualized renderers
                    try { if (scrollTarget && scrollTarget !== document && scrollTarget.scrollTop !== undefined) scrollTarget.scrollTop = Math.min((scrollTarget.scrollHeight || 0), (scrollTarget.scrollTop || 0) + Math.max(300, (scrollTarget.clientHeight || 600) * 0.7)); } catch(e){}
                    try { if (scrollTarget && scrollTarget.dispatchEvent) scrollTarget.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, bubbles: true })); } catch(e){}
                    try { window.scrollTo(0, document.body.scrollHeight); } catch(e){}

                    await delay(300 + Math.min(700, i*40));
                    expandedAttempts++;

                    const cur = currentRowCount();
                    if (cur > prevCount) {
                        prevCount = cur;
                        consecutiveNoChange = 0;
                        continue;
                    } else {
                        consecutiveNoChange++;
                        if (consecutiveNoChange >= 6) break;
                    }
                }
                try { listContainer.__expandedAttempts = expandedAttempts; } catch(e){}
                try { listContainer.__expansionError = expansionError; } catch(e){}
            } catch (e) { /* ignore expansion errors */ }

            const rows = Array.from(listContainer.querySelectorAll('[role="row"], [role="listitem"], .ms-List-cell, div[role="gridcell"], tr'));
            const items = [];
            const seen = new Set();
            for (const r of rows) {
                try {
                    let name = '';
                    const a = r.querySelector('a.ms-Link, a[role="link"], a[href]');
                    if (a && a.innerText && a.innerText.trim().length>0) name = a.innerText.trim();
                    if (!name) {
                        const s = r.querySelector('span, div');
                        if (s && s.innerText && s.innerText.trim().length>0) name = s.innerText.trim();
                    }
                    if (!name) name = safeText(r).split('\n').map(l=>l.trim()).find(l=>l.length>0) || '';
                    if (!name) continue;
                    if (seen.has(name)) continue;
                    seen.add(name);

                    let isFolder = false;
                    const aria = r.getAttribute && (r.getAttribute('aria-label') || r.getAttribute('role') || r.getAttribute('title')) || '';
                    if (/pasta|folder/i.test(aria)) isFolder = true;
                    if (!isFolder) {
                        const icon = r.querySelector('svg, img, i');
                        if (icon) {
                            const alt = (icon.getAttribute && (icon.getAttribute('alt') || icon.getAttribute('title') || '')) || '';
                            if (/folder|pasta/i.test(alt)) isFolder = true;
                        }
                    }

                    const href = (a && (a.href || a.getAttribute('href'))) || null;
                    items.push({ name, isFolder, href, selector: elementPath(r) });
                } catch(e) { /* ignore */ }
            }

            return { ok: true, rootText: safeText(rootEl), containerSelector: elementPath(listContainer), items, expandedAttempts: (typeof expandedAttempts !== 'undefined' ? expandedAttempts : 0), finalRowCount: (typeof items !== 'undefined' ? items.length : 0), expansionError: (typeof expansionError !== 'undefined' ? expansionError : null), scrollTarget: (typeof scrollTarget !== 'undefined' ? elementPath(scrollTarget) : null) };
        }, oficiosSelectorOrText);

        if (eventSender) {
            if (data && data.ok) {
                // Prefer items whose names are purely numeric (e.g., "1", "20", "010").
                // These are the real OFÍCIOS folders in this setup; filter to them when present.
                const numericItems = Array.isArray(data.items) ? data.items.filter(i => { try { return /^\d+$/.test((i.name||'').trim()); } catch(e){ return false; } }) : [];
                if (numericItems.length > 0) {
                    // Ensure they are marked as folders
                    numericItems.forEach(i => i.isFolder = true);
                    data.items = numericItems;
                    eventSender.send('log-message', { type: 'info', msg: `Criação de Pastas encontrados: ${numericItems.length} pastas numéricas detectadas (container: ${data.containerSelector})`, tech: 'listChildrenOfOficios' });
                } else {
                    // No pure-numeric names found; fall back to original detection but log that none were pure numeric
                    eventSender.send('log-message', { type: 'info', msg: `Criação de Pastas encontrados: ${data.items.length} itens (container: ${data.containerSelector}), nenhum nome puramente numérico detectado`, tech: 'listChildrenOfOficios' });
                }
                // Diagnostic: report how many "show more" expansions were attempted (0 = none)
                eventSender.send('log-message', { type: 'info', msg: `listChildrenOfOficios: expansion attempts = ${data && data.expandedAttempts ? data.expandedAttempts : 0}, finalRows=${data && data.finalRowCount ? data.finalRowCount : 0}, expansionError=${data && data.expansionError ? data.expansionError : 'none'}, scrollTarget=${data && data.scrollTarget ? data.scrollTarget : data.containerSelector}`, tech: 'listChildrenOfOficios' });
            } else {
                eventSender.send('log-message', { type: 'warn', msg: `listChildrenOfOficios: ${data && data.error ? data.error : 'unknown'}`, tech: 'listChildrenOfOficios' });
            }
        }

        return data;
    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `Erro listChildrenOfOficios: ${e && e.message}`, tech: 'listChildrenOfOficios' });
        return { ok:false, error: e && e.message };
    }
}


// New: create sequential folders after the last detected
async function createSequentialFolders(page, baseSelectorOrText, count = null, options = {}, eventSender = null, inputReceiver = null) {
    try {
        // 1. list existing
        let listResp = await listChildrenOfOficios(page, baseSelectorOrText, eventSender);
        // If root not found, treat as empty folder to allow creation attempts (avoids abort when folder exists but root detection is finicky)
        if (!listResp || !listResp.ok) {
            if (listResp && listResp.error === 'root_not_found') {
                if (eventSender) eventSender.send('log-message', { type: 'warn', msg: 'createSequentialFolders: root_not_found detected; assuming empty folder and proceeding with creation.', tech: 'createSequentialFolders' });
                listResp = { ok: true, items: [], rootText: '', containerSelector: '' };
            } else {
                if (eventSender) eventSender.send('log-message', { type: 'error', msg: `createSequentialFolders: aborting due to list failure: ${listResp && listResp.error ? listResp.error : 'unknown'}`, tech: 'createSequentialFolders' });
                return { ok:false, error: listResp && listResp.error ? listResp.error : 'list_failed' };
            }
        }

        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `createSequentialFolders: proceeding with listResp summary: ok=${!!listResp.ok}, items=${Array.isArray(listResp.items)?listResp.items.length:0}`, tech: 'createSequentialFolders' });

        const folders = listResp.items.filter(i => i.isFolder);
        // Prefer folder names that are purely numeric (e.g., "1", "20", "010").
        // This service will create subsequent numeric folders (e.g., after 20 -> 21,22,...).
        const numeric = folders.map(f => {
            const s = (f.name || '').trim();
            if (/^\d+$/.test(s)) return { raw: s, num: parseInt(s, 10), width: s.length };
            return null;
        }).filter(x => x !== null);

        let maxNum = 0;
        let width = 0;
        if (numeric.length > 0) {
            maxNum = Math.max(...numeric.map(x => x.num));
            // pick the most common width among numeric names (if consistent)
            const widthCounts = numeric.reduce((acc, x) => { acc[x.width] = (acc[x.width] || 0) + 1; return acc; }, {});
            const mostCommonWidth = Object.keys(widthCounts).sort((a,b) => (widthCounts[b] - widthCounts[a]))[0];
            width = mostCommonWidth ? parseInt(mostCommonWidth, 10) : 0;
            // Use width only if it's greater than 1 and appears in at least half of numeric names
            if (width <= 1 || (widthCounts[width] || 0) < Math.ceil(numeric.length/2)) width = 0;
        } else {
            // Fallback: try to extract trailing numbers as before
            const numMatches = folders.map(f => {
                const m = (f.name || '').match(/(\d+)\s*$/);
                return m ? parseInt(m[1],10) : null;
            }).filter(n => n !== null);
            maxNum = numMatches.length > 0 ? Math.max(...numMatches) : 0;
            width = Math.max(0, String(maxNum + (count || 0) + 1).length);
        }

        const pad = (n, w) => (w && w > 0) ? String(n).padStart(w, '0') : String(n);

        // Default naming: numeric names by default (no textual prefix). Pass options.prefix to override.
        const defaultPrefix = (options && typeof options.prefix === 'string') ? options.prefix : '';

        // If count not provided, ask the user via inputReceiver (if available)
        let toCreate = count;
        if ((typeof toCreate === 'undefined' || toCreate === null) && inputReceiver) {
            // send preview
            const previewNames = [];
            for (let i=1;i<=3;i++) previewNames.push(`${defaultPrefix}${pad(maxNum + i, width)}`);
            if (eventSender) eventSender.send('sharepoint:create-preview', { preview: previewNames, base: listResp.rootText });

            // wait for response event 'sharepoint-create-response'
            toCreate = await new Promise(resolve => {
                const handler = (resp) => {
                    if (!resp || typeof resp.count !== 'number') { resolve(null); }
                    else resolve(resp.count);
                    try { inputReceiver.removeListener('sharepoint-create-response', handler); } catch(e){}
                };
                inputReceiver.on('sharepoint-create-response', handler);
            });
        }

        if (!toCreate || typeof toCreate !== 'number' || toCreate <= 0) return { ok:false, error: 'no_count_provided' };

        // build names
        const names = [];
        for (let i=1;i<=toCreate;i++) {
            const num = maxNum + i;
            names.push(`${defaultPrefix}${pad(num, width)}`);
        }

        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Tentando criar ${names.length} pastas sequenciais através da interface UI (NOVO BOTÃO)...`, tech: 'createSequentialFolders' });

        // Skip the old generic element-scan method entirely. It fails too often in modern SharePoint.
        // We go straight to our new custom UI approach which natively protects against breadcrumb clicks and action-state errors.
        let results = [];
        for (const name of names) {
             const uiResp = await createFolderUsingSiteButtons(page, name, eventSender).catch(e => ({ ok: false, error: e && e.message ? e.message : 'ui_button_error' }));
             if (uiResp && uiResp.ok) {
                 results.push({ name: name, ok: true, reason: 'created_via_ui_buttons' });
                 if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[SUCESSO] Pasta ${name} criada pela UI.`, tech: 'createSequentialFolders' });
             } else {
                 results.push({ name: name, ok: false, reason: uiResp && uiResp.error ? uiResp.error : 'ui_flow_failed' });
                 if (eventSender) eventSender.send('log-message', { type: 'warn', msg: `[FALHA] UI não conseguiu criar pasta ${name}. Motivo: ${uiResp ? uiResp.error : 'unknown'}`, tech: 'createSequentialFolders' });
             }
        }

        // Removed all fallback syntax so UI failures don't drop to REST
        return { ok: true, requested: names.length, results };

    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `createSequentialFolders error: ${e && e.message}`, tech: 'createSequentialFolders' });
        return { ok:false, error: e && e.message };
    }
}

// Attempt to create a single folder using SharePoint REST API from the page context.
// Tries to resolve a sensible parent path (from URL 'id' param or _spPageContextInfo) and uses __REQUESTDIGEST.
async function createFolderViaRest(page, folderName, baseSelectorOrText = null, eventSender = null, manualBasePath = null) {
    try {
        const resp = await page.evaluate(async (args) => {
            const { folderNameInner, baseSelector, manualBase } = args || {};
            const safe = (v) => v || null;
            function getDigest() {
                try {
                    const el = document.getElementById('__REQUESTDIGEST');
                    if (el && el.value) return el.value;
                } catch (e) {}
                try { if (window._spPageContextInfo && window._spPageContextInfo.formDigestValue) return window._spPageContextInfo.formDigestValue; } catch(e){}
                try { if (window.__REQUESTDIGEST) return window.__REQUESTDIGEST; } catch(e){}
                return null;
            }

            function detectParentPath() {
                try {
                    const u = new URL(location.href);
                    const id = u.searchParams.get('id');
                    if (id) return decodeURIComponent(id);
                } catch (e) {}
                try {
                    if (window._spPageContextInfo && window._spPageContextInfo.webServerRelativeUrl) {
                        // Attempt to infer library from page title or baseSelector text
                        const lib = 'Shared Documents';
                        const rootText = (function(){
                            try {
                                if (baseSelector) {
                                    const el = document.querySelector(baseSelector);
                                    if (el && el.innerText) return el.innerText.trim();
                                }
                            } catch(e){}
                            try { const h = document.querySelector('h1'); if (h && h.innerText) return h.innerText.trim(); } catch(e){}
                            return '';
                        })();
                        if (rootText && rootText.length > 0) return window._spPageContextInfo.webServerRelativeUrl + '/' + lib + '/' + rootText;
                        return window._spPageContextInfo.webServerRelativeUrl + '/' + lib;
                    }
                } catch (e) {}
                return null;
            }

            const digest = getDigest();
            let parent = detectParentPath();
            // If no parent detected, try manualBase provided by caller (injected via args)
            if (!parent && typeof manualBase === 'string' && manualBase && window._spPageContextInfo && window._spPageContextInfo.webServerRelativeUrl) {
                parent = window._spPageContextInfo.webServerRelativeUrl.replace(/\/$/, '') + '/' + manualBase.replace(/^\/+|\/+$/g, '');
            }
            if (!parent) return { ok:false, error:'no_parent_path_detected', digest };

            // Build creation path — try both parent + '/' + name and library-style path
            const creationPath = `${parent.replace(/\/$/, '')}/${folderNameInner}`;

            // Try AddUsingPath endpoint first (matches observed tenant behavior)
            try {
                // Build @a1 param including encoded single quotes (%27) around the server-relative path
                const a1 = encodeURIComponent(`'${creationPath.replace(/'/g, "\'")}'`);
                const endpointAddUsingPath = `${location.origin}/_api/web/folders/AddUsingPath(DecodedUrl=@a1,overwrite=@a2)?@a1=${a1}&@a2=false&$Expand=ListItemAllFields/PermMask`;
                async function tryAddUsingPath(dg) {
                    try {
                        const h = {
                            'Accept':'application/json;odata=verbose',
                            'Content-Type':'application/json;odata=verbose; charset=utf-8',
                            'X-RequestDigest': dg || '',
                            'X-Requested-With':'XMLHttpRequest',
                            'Origin': location.origin,
                            'Referer': location.href,
                            'Accept-Language': (navigator && navigator.language) ? navigator.language : 'en-US'
                        };
                        // Some tenants expect an explicit empty body with content-length 0
                        const r = await fetch(endpointAddUsingPath, { method: 'POST', headers: h, body: '' });
                        if (r.ok) return { ok:true, status: r.status, digest: dg };
                        const body = await r.text().catch(()=>null);
                        return { ok:false, status: r.status, body, digest: dg };
                    } catch (e) {
                        return { ok:false, error: e && e.message ? e.message : String(e), digest: dg };
                    }
                }

                // First attempt with any digest we found
                const try1 = await tryAddUsingPath(digest);
                if (try1.ok) return try1;
                // If returned 401/403 or other failure, fallthrough to contextinfo/fallback below
            } catch (e) {
                // ignore and continue to older fallback
            }

            // Fallback: attempt folders/add (older endpoint)
            const endpoint = `${location.origin}/_api/web/folders/add('${creationPath}')`;

            // Helper to POST create folder with provided digest
            async function postCreate(dg) {
                try {
                    const r = await fetch(endpoint, { method: 'POST', headers: { 'Accept':'application/json;odata=nometadata', 'X-RequestDigest': dg || '' } });
                    if (r.ok) return { ok:true, status: r.status, digest: dg };
                    const body = await r.text().catch(()=>null);
                    return { ok:false, status: r.status, body, digest: dg };
                } catch (e) {
                    return { ok:false, error: e && e.message ? e.message : String(e), digest: dg };
                }
            }

            // First attempt with any digest we found
            let first = await postCreate(digest);
            if (first.ok) return first;

            // If response indicates invalid security validation or digest missing, try to obtain a fresh digest via /_api/contextinfo
            try {
                const ctxUrl = `${location.origin}/_api/contextinfo`;
                // Try with headers that return verbose JSON shape (older SharePoint flavors expect verbose)
                const ctx = await fetch(ctxUrl, { method: 'POST', headers: { 'Accept':'application/json;odata=verbose', 'Content-Type':'application/json;odata=verbose; charset=utf-8' } }).catch(()=>null);
                if (ctx) {
                    const status = ctx.status;
                    let j = null;
                    try { j = await ctx.json().catch(()=>null); } catch(e){ j = null; }
                    // Try multiple locations for FormDigestValue depending on odata format
                    const fresh = (j && (j.GetContextWebInformation && j.GetContextWebInformation.FormDigestValue))
                                  || (j && j.d && j.d.GetContextWebInformation && j.d.GetContextWebInformation.FormDigestValue)
                                  || (j && j.FormDigestValue) || null;

                    if (fresh) {
                        // retry with fresh digest
                        const second = await postCreate(fresh);
                        if (second.ok) return Object.assign({ ok:true, status: second.status || 200 }, second);
                        // return second even if failed so caller can see body/status/digest
                        return Object.assign({ ok:false, status: second.status || null }, second);
                    } else {
                        // Provide full diagnostic: include parsed JSON if any, and raw text
                        const raw = await ctx.text().catch(()=>null);
                        return { ok:false, error:'contextinfo_no_digest', status, parsed: j, body: raw };
                    }
                } else {
                    return { ok:false, error:'contextinfo_failed', status: null, body: null };
                }
            } catch (e) {
                return { ok:false, error: e && e.message ? e.message : String(e), digest };
            }
        }, { folderNameInner: folderName, baseSelector: baseSelectorOrText, manualBase: manualBasePath });

        return resp || { ok:false, error:'no_response' };
    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `createFolderViaRest error: ${e && e.message}`, tech: 'createFolderViaRest' });
        return { ok:false, error: e && e.message ? e.message : String(e) };
    }
}

// UI-based attempt: use the site's own "New" / "Novo" button and menu to create a folder.
// This tries multiple flows and is frame-aware. Returns {ok:true} on success or {ok:false, error:..}.
async function createFolderUsingSiteButtons(page, folderName, eventSender = null) {
    try {
        // Targeted flow for the observed DOM:
        // 1) Click toolbar 'Novo' button (data-automationid: newComposite/newCommand or aria-controls command-bar-menu-id)
        // 2) Click menu item button[data-automationid="newFolderCommand"] (label: 'Pasta')
        // 3) Wait for dialog input[data-automation-id="nameDialogTextField"] (or #textField25), fill and click button[data-automation-id="Criar"].

        // Targeted flow for the observed modern SharePoint DOM:
        // 1) Click toolbar 'Novo'/'Criar ou carregar' button
        // 2) Click menu item button[data-automationid="newFolderCommand"] (label: 'Pasta')
        // 3) Fill dialog input[data-automation-id="nameDialogTextField"] and click button[data-automation-id="Criar"].

        const tryFlow = async (ctx) => {
            const debugLog = (msg) => {
                // Forçado como 'info' para ter certeza que aparece na tela do app
                if (eventSender) eventSender.send('log-message', { type: 'info', msg: `[SP-BOT] ${msg}`, tech: 'createFolderUsingSiteButtons' });
                else console.log(`[SP-BOT] ${msg}`);
            };

            // Se for um frame, verifique se a URL dele pertence ao SharePoint; se não, ignore para evitar cliques em ads/widgets
            try {
                const url = await ctx.url();
                debugLog(`Verificando contexto: ${url}`);
                if (url && (url.includes('about:blank') || (!url.includes('sharepoint.com') && !url.includes('microsoftonline.com')))) {
                    debugLog(`Contexto ignorado por não ser SharePoint/Válido.`);
                    return { ok: false, error: 'invalid_frame_context' };
                }
            } catch(e) {}

            try {
                debugLog(`Aguardando estabilização da página (1.5s)...`);
                await ctx.waitForTimeout(1500);

                let clickedNovo = false;
                
                // Primeiro: Tentar o selector matador mais exato que existe na nova UI 
                // e que escapa do Breadcrumb naturalmente por ser o command bar principal
                const exactNewBtn = await ctx.$('button[data-automationid="newCommand"]');
                if (exactNewBtn && await exactNewBtn.isVisible()) {
                    debugLog(`Botão 'Novo' EXATO encontrado (data-automationid=newCommand). Clicando via JS...`);
                    try {
                        await exactNewBtn.evaluate(el => el.click());
                        clickedNovo = true;
                    } catch(e) {
                        debugLog(`Falha no click exato: ${e.message}`);
                    }
                }

                if (!clickedNovo) {
                    debugLog(`Buscando alternativas para botão 'Novo' ou 'Criar ou carregar'...`);
                    const novoSelectors = [
                        'button[title="Criar ou carregar"]',
                        'button[name="Novo"]',
                        '.ms-CommandBar button:has-text("Novo")',
                        '[data-automation-id="pageHeader"] button[data-id="newComposite"]',
                        '#sp-command-bar button[data-id="newComposite"]',
                        'button[data-id="newComposite"]' // Fallback amplo
                    ];

                    for (const s of novoSelectors) {
                        try {
                            const elements = await ctx.$$(s);
                            for (const el of elements) {
                                if (el && await el.isVisible()) {
                                    const outerHTML = await el.evaluate(n => n.outerHTML.substring(0, 150));
                                    debugLog(`Avaliando elemento '${s}': ${outerHTML}`);
                                    
                                    // Bloqueio apenas baseado no atributo ou classe de nav
                                    const isBreadcrumb = await el.evaluate(node => {
                                        let curr = node;
                                        let depth = 0;
                                        while (curr && depth < 5) { // Limita a busca a 5 ancestrais para não pegar os containers globais
                                            if (curr.classList && curr.classList.contains("ms-Breadcrumb")) return true;
                                            if (curr.getAttribute && curr.getAttribute("aria-label") && curr.getAttribute("aria-label").toLowerCase().includes("breadcrumb")) return true;
                                            curr = curr.parentElement;
                                            depth++;
                                        }
                                        return false;
                                    });
                                    
                                    if (!isBreadcrumb) {
                                        debugLog(`Elemento APROVADO. Clicando via JS...`);
                                        try {
                                            await el.evaluate(n => n.click());
                                            clickedNovo = true;
                                            break;
                                        } catch(e) {
                                            debugLog(`Falha no click do Novo: ${e.message}`);
                                        }
                                    } else {
                                        debugLog(`Elemento REJEITADO (Parece Breadcrumb).`);
                                    }
                                }
                            }
                        } catch (e) {
                             debugLog(`Erro ao testar seletor '${s}': ${e.message}`);
                        }
                        if (clickedNovo) break;
                    }
                }

                if (!clickedNovo) {
                    debugLog(`Nenhum seletor principal do botão 'Novo' funcionou. Tentando fallback geométrico...`);
                    // Try one very strict fallback: exact button by name, but assert its top/left position is likely a menu bar
                    try {
                        const fallbackBtns = await ctx.$$('button:has-text("Novo")');
                        for (const b of fallbackBtns) {
                             if(await b.isVisible()) {
                                 const boundingBox = await b.boundingBox();
                                 if (boundingBox && boundingBox.y > 100 && boundingBox.y < 300) { // Typical command bar Y-level. Breadcrumb is usually higher or same, but text differs.
                                     debugLog(`Fallback geométrico aceito (Y=${boundingBox.y}). Clicando via JS 'Novo'.`);
                                     try {
                                         await b.evaluate(el => el.click());
                                         clickedNovo = true;
                                         break;
                                     } catch(e) {
                                         debugLog(`Falha clc fallback: ${e.message}`);
                                     }
                                 } else {
                                     debugLog(`Fallback IGNORADO devido a posição Y inválida (Y=${boundingBox ? boundingBox.y : 'null'}). Provável Breadcrumb.`);
                                 }
                             }
                        }
                    } catch(e){}
                }

                if (!clickedNovo) {
                    debugLog(`Botão 'Novo' não foi encontrado de nenhuma forma neste contexto.`);
                    return { ok: false, error: 'new_button_not_found' };
                }

                 // Wait shortly for contextual menu to appear. Modern SP uses `#command-bar-menu-id` ou `.ms-ContextualMenu`
                debugLog(`Aguardando menu contextual do botão Pasta aparecer...`);
                // Ampliamos as classes observadas antes de disparar o clique do menu
                try { await ctx.waitForSelector('#command-bar-menu-id, .ms-ContextualMenu, .ms-Callout, button[data-automationid="newFolderCommand"], span.ms-ContextualMenu-itemText', { timeout: 3000 }); } catch(e){}

                // Click the 'Pasta' menu item
                debugLog(`Buscando opção 'Pasta' no menu...`);
                
                // Nós iteramos sobre várias possibilidades se o menu for renderizado de forma complexa (DOM voador do final do body)
                const folderBtnSelectors = [
                    'button[data-automationid="newFolderCommand"]',
                    'button[name="Pasta"]',
                    '.ms-ContextualMenu-link:has-text("Pasta")',
                    'span.ms-ContextualMenu-itemText:has-text("Pasta")',
                    'li[role="menuitem"]:has-text("Pasta")'
                ];

                let folderBtn = null;
                for (const sel of folderBtnSelectors) {
                    try {
                        const el = await ctx.$(sel);
                        if (el && await el.isVisible()) {
                            folderBtn = el;
                            debugLog(`Opção 'Pasta' encontrada pelo seletor: ${sel}`);
                            break;
                        }
                    } catch(e) {}
                }

                // E se o botão estiver renderizado fora do fluxo normal do frame mas sim no <body> principal do documento como um portal?
                if (!folderBtn) {
                     // Executa varredura profunda no documento inteiro em busca da span específica mencionada
                     debugLog(`Opção 'Pasta' não achada por seletores normais. Inspecionando DOM do menu...`);
                     folderBtn = await ctx.evaluateHandle(() => {
                         // Procura todas as spans baseadas na menção "Pasta"
                         const spans = Array.from(document.querySelectorAll('span.ms-ContextualMenu-itemText, span.ms-Button-label, div[role="menuitem"]'));
                         const target = spans.find(s => s.innerText && s.innerText.trim() === 'Pasta');
                         if (target) {
                             // Se o target for apenas o texto "span", nós escalamos até o botão clícável real (li, button ou a)
                             const clickable = target.closest('button, a, li, [role="menuitem"]') || target;
                             return clickable;
                         }
                         return null;
                     });

                     const isNull = await folderBtn.evaluate(el => el === null);
                     if (isNull) folderBtn = null;
                }

                if (!folderBtn) {
                     debugLog(`Opção 'Pasta' DEFINITIVAMENTE NÃO encontrada na tela.`);
                     return { ok:false, error: 'menu_folder_button_not_found' };
                }

                debugLog(`Opção 'Pasta' resolvida. Disparando clique...`);
                
                // Precisamos garantir que não será interceptado por outras animações. Vamos tentar clicar de 2 formas.
                try {
                    await folderBtn.evaluate(el => el.click());
                } catch(e) {
                    debugLog(`Falha no via .evaluate(): ${e.message}. Tentando via .click()...`);
                    try { await folderBtn.click({ delay: 50 }); } catch (er) {}
                }

                // Wait for dialog input; prefer data-automation-id
                debugLog(`Aguardando input text para nome da pasta...`);

                // Nova UI tem IDs que variam, então usamos placeholder, label, role e vários fallbacks visuais.
                let inputSel = [
                    'input[data-automation-id="nameDialogTextField"]',
                    'input.ms-TextField-field',
                    'input[placeholder*="Pasta"]',
                    'input[placeholder*="folder"]',
                    'input:not([type="hidden"])[value=""]',
                    'input[type="text"]', // Genérico, o único input text na modal normalmente é o nome da pasta
                    'div[role="dialog"] input'
                ].join(', ');

                let nameInput = null;
                try { 
                    debugLog(`Usando seleteores amplos: ${inputSel}`);
                    nameInput = await ctx.waitForSelector(inputSel, { timeout: 4500, state: 'visible' }); 
                } catch(e) {
                    debugLog(`waitForSelector estourou o tempo. Fazendo inspeção forçada do DOM do Dialog...`);
                    // Se a espera oficial falhar, vamos fazer uma varredura via código no DOM para tentar achar QUALQUER input
                    nameInput = await ctx.evaluateHandle(() => {
                        const dlgs = document.querySelectorAll('[role="dialog"], .ms-Dialog, .ms-Modal');
                        for (let d of dlgs) {
                            const inp = d.querySelector('input[type="text"], input:not([type="hidden"])');
                            if (inp) return inp;
                        }
                        // Fallback global de emergência...
                        const allInputs = document.querySelectorAll('input:not([type="hidden"])');
                        for (let i of allInputs) {
                            if (i.getBoundingClientRect().width > 10) return i; // Se for visível
                        }
                        return null;
                    });

                    if (nameInput) {
                        const isNull = await nameInput.evaluate(el => el === null);
                        if (isNull) nameInput = null;
                        else debugLog(`Incrível! Encontramos o input text escapando das limitações do Playwright.`);
                    }
                }

                if (!nameInput) {
                    debugLog(`Input text 'Nome da Pasta' não foi encontrado. Modal bloqueado/ausente.`);
                    return { ok:false, error: 'name_input_not_found' };
                }

                // Fill: type with a short per-character delay so the page's JS can validate progressively
                debugLog(`Input text encontrado. Escrevendo '${folderName}'...`);
                try {
                    try { await nameInput.fill(''); } catch(e){}
                    try {
                        // Prefer ElementHandle.type when available (slower but reliable)
                        if (typeof nameInput.type === 'function') {
                            await nameInput.type(folderName, { delay: 50 });
                        } else {
                            // Fallback: set value and dispatch events
                            await nameInput.evaluate((el, val) => { el.focus(); if ('value' in el) el.value = val; else el.innerText = val; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }, folderName);
                        }

                        // Ensure change/input events fired
                        try { await nameInput.evaluate(el => { el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }); } catch(e){}
                    } catch(e) {
                        try { await nameInput.fill(folderName); } catch(e){}
                    }
                } catch (e) {
                    debugLog(`Erro durante a digitação: ${e.message}`);
                }

                // Click Criar button — wait until it becomes enabled after filling (SharePoint may validate async)
                debugLog(`Buscando botão 'Criar' final...`);
                let createBtn = null;
                
                // Buscar botão 'Criar' com os seletores padrões fortes e o selector específico de span relatado
                const createSelectors = [
                    'button[data-automation-id="Criar"]',
                    'span.ms-Button-label:has-text("Criar")',
                    'button:has-text("Criar")',
                    '[role="dialog"] button.ms-Button--primary'
                ];

                for (const sel of createSelectors) {
                    try {
                        const el = await ctx.$(sel);
                        if (el && await el.isVisible()) {
                            createBtn = el;
                            debugLog(`Botão 'Criar' localizado com sucesso pelo seletor: ${sel}`);
                            // Se achou uma span como alvo, vamos subir a arvore para pegar pra clicar no wrapper dela (button) para garantir
                            const isSpan = await createBtn.evaluate(e => e.tagName.toLowerCase() === 'span');
                            if (isSpan) {
                                const parentObj = await createBtn.evaluateHandle(el => el.closest('button') || el);
                                createBtn = parentObj;
                            }
                            break;
                        }
                    } catch(e){}
                }

                if (createBtn) {
                    debugLog(`Botão 'Criar' válido encontrado. Processando ativação.`);
                    try { await createBtn.evaluate(b => b.removeAttribute && b.removeAttribute('disabled')); } catch(e){}

                    // trigger blur so validation runs
                    try { await nameInput.evaluate(el => el.blur && el.blur()); } catch(e){}

                    // Espera curta manual em JS purão para estabilizar digitação e regras de negocio Fluent UI
                    await ctx.waitForTimeout(500);

                    // Wait for the button to enable; poll quickly but allow slightly longer for validation (up to ~1.8s)
                    let clicked = false;
                    for (let i = 0; i < 15; i++) {
                        try {
                            const enabled = await createBtn.evaluate(b => {
                                try {
                                    const dis = b.getAttribute && (b.getAttribute('disabled') || b.getAttribute('aria-disabled'));
                                    const cls = b.className || '';
                                    return !(dis === 'true' || dis === '' || dis === 'disabled' || cls.indexOf('is-disabled') !== -1 || b.disabled === true);
                                } catch(e) { return false; }
                            });
                            if (enabled) { 
                                debugLog(`Botão 'Criar' detectado como HABILITADO. Confirmando criação.`);
                                // Típicamente no frame/FluentUI, evaluateHandle click ignora popups escondendo element
                                await createBtn.evaluate(el => el.click()).catch(e => debugLog(`Falha click JS: ${e.message}`));

                                await ctx.waitForTimeout(1000); // 1.0s fixo de fôlego!
                                
                                // Wait for dialog to vanish to signal success
                                try {
                                    debugLog(`Aguardando Modal de Criação sumir da tela...`);
                                    await ctx.waitForSelector('h2:has-text("Crie uma pasta"), h2:has-text("Create a folder"), dialog, [role="dialog"]', { state: 'detached', timeout: 5000 });
                                    debugLog(`SUCESSO COMPLETO: Criação detectada com modal sumindo.`);
                                    
                                    // Ação anti-sobreposição para o próximo loop (A barra de Novo pode sumir por 1s ou ficar stale pós criação)
                                    await ctx.waitForTimeout(800);
                                    
                                    return { ok:true }; 
                                } catch(e){
                                    debugLog(`Aviso: Modal de Criação demorou a sumir ou interceptou timeout.`);
                                }
                                break; 
                            }
                        } catch(e){}
                        await ctx.waitForTimeout(120);
                    }
                    if (!clicked) {
                        debugLog(`Botão 'Criar' pareceu desabilitado muito tempo, tentando clique forçado final.`);
                        // final attempt: click anyway
                        try { 
                            await createBtn.click({ delay: 100 }).catch(e => debugLog(`Falha click criar force: ${e.message}`)); 
                            // Wait shortly to see if it takes
                            await ctx.waitForTimeout(500);
                            const exists = await createBtn.isVisible().catch(()=>false);
                            if (!exists) {
                                debugLog(`SUCESSO: Clique forçado eliminou Modal de Criação.`);
                                return { ok: true };
                            }
                        } catch(e){}
                    }
                } else {
                    debugLog(`Botão 'Criar' não encontrado. Recorrendo a tecla "ENTER" no Input.`);
                    // press Enter in input
                    try { await nameInput.press('Enter', { delay: 100 }); } catch(e){}
                }
                
                // Final check: did the name of the folder appear in the list?
                debugLog(`Verificação Pós-Criar: Checando se existe elemento com nome '${folderName}' listado.`);
                try {
                    await ctx.waitForTimeout(1000);
                    const listFolder = await ctx.$(`button[data-automationid="${folderName}"], div:has-text("${folderName}")`);
                    if (listFolder) {
                        debugLog(`SUCESSO: Pasta verificada na lista de arquivos.`);
                        return { ok: true };
                    }
                    debugLog(`Falha ao ver pasta na listagem pós-criação.`);
                } catch(e) {
                     debugLog(`Erro na checagem final: ${e.message}`);
                }
            return { ok:false, error: 'not_detected_after_create' };
            } catch (e) {
                return { ok:false, error: e && e.message };
            }
        };

        // Try main page context first, if it fails then consider frames. 
        // We avoid parallel loops to prevent double clicks and session state conflicts.
        const mainRes = await tryFlow(page);
        if (mainRes && mainRes.ok) return mainRes;

        // If main page didn't have the button, check if a valid SharePoint frame exists.
        const frames = page.frames();
        for (const f of frames) {
            try {
                const url = f.url();
                if (!url || url.includes('about:blank') || (!url.includes('sharepoint.com') && !url.includes('microsoftonline.com'))) continue;
                
                const frameRes = await tryFlow(f);
                if (frameRes && frameRes.ok) return frameRes;
            } catch(e){}
        }

        return { ok:false, error: mainRes.error || 'all_attempts_failed' };
    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `createFolderUsingSiteButtons error: ${e && e.message}`, tech: 'createFolderUsingSiteButtons' });
        return { ok:false, error: e && e.message };
    }
}

/**
 * Retorna resumo de pastas OFÍCIOS detectadas na página (usando scanDocumentFolders).
 */
async function getOficiosFolders(page, eventSender = null) {
    const scanned = await scanDocumentFolders(page, eventSender);
    const oficios = scanned.filter(s => s.isOficios).map(s => ({ name: s.name, selector: s.pathHint || s.selector || null, frameUrl: s.frameUrl }));
    if (eventSender) eventSender.send('log-message', { type: 'info', msg: `getOficiosFolders: ${oficios.length} encontrados.`, tech: 'getOficiosFolders' });
    return oficios;
}

module.exports = {
    scanDocumentFolders,
    attachPopupFocusHandler,
    openOficiosRoot,
    listChildrenOfOficios,
    getOficiosFolders,
    createFolders,
    createSequentialFolders
};
