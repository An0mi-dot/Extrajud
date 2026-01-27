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

    if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Scan completo: ${uniq.length} candidatos encontrados (${uniq.filter(u=>u.isOficios).length} OFÍCIOS).`, tech: 'scanDocumentFolders' });

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
            console.log('[SharePoint Service] Dialog opened:', dialog.message());
        });

        page.on('popup', popup => {
            if (eventSender) eventSender.send('bring-window-front', { reason: 'popup' });
            console.log('[SharePoint Service] Popup opened:', popup.url());
        });

        page.on('filechooser', fc => {
            if (eventSender) eventSender.send('bring-window-front', { reason: 'filechooser' });
            console.log('[SharePoint Service] File chooser requested');
        });

    } catch (e) {
        console.warn('[SharePoint Service] Falha ao anexar handlers de popup:', e && e.message);
    }
}

/**
 * Navega diretamente para a pasta OFÍCIOS (URL fornecida pelo usuário/serviço)
 * Retorna true se a navegação ocorreu sem erro.
 */
async function openOficiosRoot(page, url, eventSender = null) {
    const DEFAULT_URL = "https://iberdrola.sharepoint.com/sites/JUDCOELBA/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FJUDCOELBA%2FShared%20Documents%2FOF%C3%8DCIOS%202026&viewid=b0389131%2Db788%2D4354%2D8edd%2Dcfe27a229f93&ct=1720187493260&or=Teams%2DHL&LOF=1&ovuser=031a09bc%2Da2bf%2D44df%2D888e%2D4e09355b7a24%2Cjoao%2Eaviana%40neoenergia%2Ecom&OR=Teams%2DHL&CT=1769431380333&clickparams=eyJBcHBOYW1lIjoiVGVhbXMtRGVza3RvcCIsIkFwcFZlcnNpb24iOiIxNDE1LzI1MTEzMDAxMzEyIiwiSGFzRmVkZXJhdGVkVXNlciI6ZmFsc2V9";
    let target = String(url || DEFAULT_URL);

    // Sanitize URL to avoid sending ephemeral tokens (keep only safe query params)
    try {
        const u = new URL(target);
        const allowed = ['id', 'viewid'];
        const qp = new URLSearchParams();
        for (const k of allowed) if (u.searchParams.has(k)) qp.set(k, u.searchParams.get(k));
        const clean = `${u.origin}${u.pathname}${qp.toString() ? ('?' + qp.toString()) : ''}`;
        if (clean !== target) {
            if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Sanitizando URL SharePoint. Navegando para: ${clean}`, tech: 'openOficiosRoot' });
            target = clean;
        }
    } catch (e) {
        // ignore URL parse errors and use original
    }

    try {
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Navegando para SharePoint: ${target}`, tech: 'openOficiosRoot' });
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 90000 });
        // Pequeno delay para que frames e scripts carreguem
        await page.waitForTimeout(2500);
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Navegação concluída: ${target}`, tech: 'openOficiosRoot' });
        return true;
    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `Falha ao navegar para SharePoint: ${e && e.message}`, tech: 'openOficiosRoot' });
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
            throw new Error('Base folder not found on page. Use the DevTools extractor to get selectors.');
        }

        // If we have a base element handle, click to open base folder. Otherwise assume current folder is already active.
        if (baseElHandle) {
            try { await baseElHandle.scrollIntoViewIfNeeded(); } catch(e){}
            try { await baseElHandle.click(); } catch(e) { try { await page.evaluate(el => el.click(), baseElHandle); } catch(e2){} }
            await page.waitForTimeout(DEFAULT_WAIT);
        } else {
            // no-op: operate on current view
            if (eventSender) eventSender.send('log-message', { type: 'info', msg: 'Nenhuma base selecionada; operando na pasta atual', tech: 'createFolders' });
            await page.waitForTimeout(800);
        }

        // 2. For each name: try to press "New" -> "Folder" buttons, fallback to keyboard shortcuts
        for (const name of names) {
            const res = { name, ok: false, reason: null };
            try {
                // Common modern SharePoint new folder sequence
                // Try toolbar 'New' button
                const newBtn = await page.$('button[aria-label*="Novo" i], button[aria-label*="New" i], a[title*="Novo" i], a[title*="New" i]');
                if (newBtn) {
                    await newBtn.click();
                    await page.waitForTimeout(500);

                    // Try to click 'Folder' option
                    const folderOption = await page.$('button[role="menuitem"]:has-text("Pasta"), button:has-text("Pasta"), button:has-text("Folder"), a:has-text("Pasta")');
                    if (folderOption) {
                        await folderOption.click();
                    } else {
                        // Sometimes clicking New opens a panel with a "Folder" option anchor
                        const folderLink = await page.$('a:has-text("Pasta"), a:has-text("Folder")');
                        if (folderLink) await folderLink.click();
                    }
                }

                // Wait for create folder dialog/panel
                await page.waitForTimeout(800);

                // Try to find an input for folder name
                const nameInputSelectors = ['input[aria-label*="Nome" i]', 'input[name*="Name" i]', 'input[type="text"]'];
                let nameInput = null;
                for (const s of nameInputSelectors) {
                    try { nameInput = await page.$(s); if (nameInput) break; } catch(e){}
                }

                if (!nameInput) {
                    // Try panel: look for contenteditable div
                    const editable = await page.$('[contenteditable="true"]');
                    if (editable) nameInput = editable;
                }

                if (!nameInput) throw new Error('Campo de nome da pasta não encontrado');

                await nameInput.fill(name);
                // Click create/ok button
                const createBtn = await page.$('button:has-text("Criar"), button:has-text("Create"), button:has-text("Ok"), button[aria-label*="Criar" i]');
                if (createBtn) {
                    await createBtn.click();
                } else {
                    // try press Enter
                    await nameInput.press('Enter');
                }

                // Wait for creation to complete (simple heuristic: wait and then check for name existence)
                await page.waitForTimeout(1500);
                const found = await page.$(`text="${name}"`);
                if (found) { res.ok = true; }
                else { res.reason = 'Não detectei a pasta após tentativa de criação'; }

            } catch (e) {
                res.reason = e && e.message;
            }
            results.push(res);
        }

    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `Erro createFolders: ${e.message}`, tech: 'createFolders' });
        results.push({ name: null, ok: false, reason: e.message });
    }

    return results;
}

/**
 * Lista os filhos (itens/pastas) do diretório OFÍCIOS encontrado na página.
 * oficiosSelectorOrText: seletor CSS da raiz ou texto parcial (ex: 'OFÍCIOS 2026').
 * Retorna array de { name, isFolder, href, selector }
 */

async function listChildrenOfOficios(page, oficiosSelectorOrText = null, eventSender = null) {
    try {
        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Procurando OFÍCIOS: ${oficiosSelectorOrText || '[auto]'}`, tech: 'listChildrenOfOficios' });

        const data = await page.evaluate((sel) => {
            function safeText(el){ try { return (el && el.innerText) ? el.innerText.trim() : ''; } catch(e){ return ''; } }
            function elementPath(el){ try { if(!el) return ''; const path=[]; let cur=el, depth=0; while(cur && cur.nodeType===1 && depth++<12){ let part=cur.tagName.toLowerCase(); if(cur.id) part += `#${cur.id}`; else if(cur.className) part += `.${(cur.className||'').toString().split(/\s+/).slice(0,3).join('.')}`; const sib = Array.from(cur.parentNode?cur.parentNode.children:[]).indexOf(cur)+1; part += `:nth-child(${sib})`; path.unshift(part); cur = cur.parentNode; } return path.join(' > '); } catch(e){ return ''; } }

            // Find root element by selector or by text
            let rootEl = null;
            if (sel) rootEl = document.querySelector(sel);
            if (!rootEl) {
                rootEl = Array.from(document.querySelectorAll('div, section, header, main')).find(d => /OF[IÍ]CIOS\s*\d{4}/i.test(safeText(d)));
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

            return { ok: true, rootText: safeText(rootEl), containerSelector: elementPath(listContainer), items };
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
                    eventSender.send('log-message', { type: 'info', msg: `OFÍCIOS encontrados: ${numericItems.length} pastas numéricas detectadas (container: ${data.containerSelector})`, tech: 'listChildrenOfOficios' });
                } else {
                    // No pure-numeric names found; fall back to original detection but log that none were pure numeric
                    eventSender.send('log-message', { type: 'info', msg: `OFÍCIOS encontrados: ${data.items.length} itens (container: ${data.containerSelector}), nenhum nome puramente numérico detectado`, tech: 'listChildrenOfOficios' });
                }
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
        const listResp = await listChildrenOfOficios(page, baseSelectorOrText, eventSender);
        if (!listResp || !listResp.ok) return { ok:false, error: listResp && listResp.error ? listResp.error : 'list_failed' };

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

        if (eventSender) eventSender.send('log-message', { type: 'info', msg: `Tentando criar ${names.length} pastas: ${names.join(', ')}`, tech: 'createSequentialFolders' });

        const results = await createFolders(page, baseSelectorOrText, names, eventSender);

        return { ok: true, requested: names.length, results };

    } catch (e) {
        if (eventSender) eventSender.send('log-message', { type: 'error', msg: `createSequentialFolders error: ${e && e.message}`, tech: 'createSequentialFolders' });
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
