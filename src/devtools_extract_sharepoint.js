(function(){
    // DevTools snippet: execute on the SharePoint page (Console) to extract frames, folders and candidates.
    // This version does a deeper scan (scrolling + clicking common "show more" buttons), and provides a robust clipboard fallback (overlay textarea + download link).
    const log = console.log.bind(console);

    function safeText(el) { try { return (el && el.innerText) ? el.innerText.trim() : ''; } catch(e) { return ''; } }
    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

    const result = {
        timestamp: (new Date()).toISOString(),
        location: { href: location.href, title: document.title },
        frames: []
    };

    // Scrolls the given document down in steps to trigger lazy-loads
    async function deepScroll(doc, steps = 8, stepDelay = 400) {
        try {
            const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
            for (let i = 0; i < steps; i++) {
                const y = Math.floor((i + 1) / steps * h);
                doc.defaultView.scrollTo({ top: y, behavior: 'auto' });
                await sleep(stepDelay);
            }
            // final small scroll to ensure bottom
            doc.defaultView.scrollTo({ top: h, behavior: 'auto' });
            await sleep(stepDelay);
        } catch (e) { /* ignore cross-origin or missing windows */ }
    }

    // Click common "show more"/"carregar mais" buttons to expand lists when present
    function clickShowMore(doc) {
        const candidates = Array.from(doc.querySelectorAll('button, a, span'))
            .filter(el => {
                const t = safeText(el).toLowerCase();
                return /mostrar mais|ver mais|carregar mais|show more|load more|view more|mais itens|expandir/i.test(t);
            });
        candidates.forEach(c => {
            try { c.click(); } catch(e) { try { c.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){} }
        });
        return candidates.length;
    }

    // helper to scan a document (works in each frame if same-origin)
    function scanDoc(doc) {
        const out = { url: doc.location ? doc.location.href : null, title: doc.title || null, candidates: [], documentNodeCount: 0, documentNodePreview: [] };

        // Detect potential 'Documentos' nodes
        const docNodes = Array.from(doc.querySelectorAll('a,span,div,li')).filter(el => safeText(el).toLowerCase().includes('documento') || safeText(el).toLowerCase().includes('documentos') || safeText(el).toLowerCase().includes('document library'));
        out.documentNodeCount = docNodes.length;
        out.documentNodePreview = docNodes.slice(0,20).map(n => ({ text: safeText(n).slice(0,140), selector: elementPath(n) }));

        // Enhanced candidate selection: include role-based grid/row cells and typical SharePoint structures
        const selectors = ['a','span','div','li','div[role="row"]','div[role="gridcell"]','div[role="rowheader"]','div.ms-List-cell'];
        const all = selectors.reduce((acc, sel) => acc.concat(Array.from(doc.querySelectorAll(sel))), []);

        const seen = new Set();
        const cand = [];
        for (const el of all) {
            const t = safeText(el);
            if (!t || t.length < 2 || t.length > 400) continue;
            if (/^\d+$/.test(t)) continue;
            const att = (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('role'))) || '';
            const cls = (el.className || '').toString().toLowerCase();
            if (cls.includes('folder') || cls.includes('ms-folder') || cls.includes('document-library') || cls.includes('od-folder') || cls.includes('ms-list')) {
                if (!seen.has(t)) { seen.add(t); cand.push(el); }
                continue;
            }
            if (att && /folder|pasta|documento/i.test(att)) { if (!seen.has(t)) { seen.add(t); cand.push(el); } continue; }
            if (el.tagName === 'A' && el.getAttribute && el.getAttribute('href') && t) { if (!seen.has(t)) { seen.add(t); cand.push(el); } continue; }
            if (el.closest && el.closest('li')) { if (!seen.has(t)) { seen.add(t); cand.push(el); } continue; }
        }

        out.candidates = cand.slice(0,2000).map(el => ({ text: safeText(el), href: (el.getAttribute && el.getAttribute('href')) || null, title: el.getAttribute && el.getAttribute('title'), aria: el.getAttribute && el.getAttribute('aria-label'), class: el.className || null, selector: elementPath(el) }));

        // highlight those that start with OFÍCIOS
        out.oficios = out.candidates.filter(c => /^of[ií]cios\s*\d{4}/i.test(c.text)).map(c => c.text);

        return out;
    }

    // utility to produce a short unique selector path for debugging
    function elementPath(el) {
        try {
            if (!el) return '';
            const path = [];
            let cur = el;
            let depth = 0;
            while (cur && cur.nodeType === 1 && depth++ < 10) {
                let part = cur.tagName.toLowerCase();
                if (cur.id) part += `#${cur.id}`;
                else if (cur.className) part += `.${(cur.className||'').toString().split(/\s+/).slice(0,3).join('.')}`;
                const sibIndex = Array.from(cur.parentNode ? cur.parentNode.children : []).indexOf(cur) + 1;
                part += `:nth-child(${sibIndex})`;
                path.unshift(part);
                cur = cur.parentNode;
            }
            return path.join(' > ');
        } catch(e) { return ''; }
    }

    // MAIN: attempt a deeper scan per frame (scroll + click more) for better coverage
    (async () => {
        try {
            // Scan main document with scroll and expand attempts
            try { await deepScroll(document, 10, 350); } catch(e){}
            try { clickShowMore(document); } catch(e){}
            result.frames.push(scanDoc(document));
        } catch (e) { log('Erro na varredura do documento principal:', e); }

        // Try frames/iframes
        const iframes = Array.from(document.querySelectorAll('iframe, frame'));
        result.iframeCount = iframes.length;

        for (let idx = 0; idx < iframes.length; idx++) {
            const f = iframes[idx];
            const frameInfo = { index: idx, src: f.src || null, name: f.name || null, selector: elementPath(f), sameOrigin: null, data: null };
            try {
                const doc = f.contentDocument;
                if (doc) {
                    frameInfo.sameOrigin = true;
                    try { await deepScroll(doc, 8, 300); } catch(e){}
                    try { clickShowMore(doc); } catch(e){}
                    frameInfo.data = scanDoc(doc);
                } else {
                    frameInfo.sameOrigin = false;
                }
            } catch(e) {
                frameInfo.sameOrigin = false;
            }
            result.frames.push(frameInfo);
        }

        // Build ofícios summary
        const oficiosFound = [];
        result.frames.forEach(f => {
            try {
                const data = f.data || f;
                if (data && data.candidates) {
                    data.candidates.forEach(c => {
                        if (/^of[ií]cios\s*\d{4}/i.test(c.text)) oficiosFound.push({ text: c.text, selector: c.selector, frameUrl: f.url || (document && document.location && document.location.href) });
                    });
                }
            } catch(e) {}
        });
        result.oficiosSummary = oficiosFound.slice(0,200);

        // Output summary
        log('--- SharePoint Scan Result ---');
        log('Timestamp:', result.timestamp);
        log('Location:', result.location);
        log('Iframes detected:', result.iframeCount);
        log('Candidates total (first frame):', result.frames[0] && result.frames[0].candidates ? result.frames[0].candidates.length : 0);
        if (result.oficiosSummary.length > 0) {
            log('OFÍCIOS folders detected (preview):', result.oficiosSummary.slice(0,10));
        } else {
            log('No OFÍCIOS folders detected by heuristics.');
        }

        // Attempt to copy to clipboard (user must allow in browser context)
        const text = JSON.stringify(result, null, 2);
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                log('JSON copied to clipboard. Paste it somewhere.');
            } else throw new Error('clipboard_api_unavailable');
        } catch(e) {
            log('Clipboard write failed - providing manual copy UI and download link.');
            try {
                // create overlay with textarea for easy selection
                const overlay = document.createElement('div');
                Object.assign(overlay.style, { position: 'fixed', zIndex: 2147483647, left: '10px', right: '10px', top: '10px', bottom: '10px', backgroundColor: 'rgba(255,255,255,0.98)', border: '2px solid #444', padding: '12px', overflow: 'auto' });
                const header = document.createElement('div'); header.textContent = 'SharePoint Scan JSON (copy manually and then close)'; header.style.fontWeight = 'bold'; header.style.marginBottom = '8px';
                const ta = document.createElement('textarea'); ta.value = text; ta.style.width = '100%'; ta.style.height = '80%'; ta.style.fontSize = '12px'; ta.style.fontFamily = 'monospace';
                const btnClose = document.createElement('button'); btnClose.textContent = 'Close'; btnClose.style.marginTop = '8px'; btnClose.onclick = () => { try { document.body.removeChild(overlay); } catch(e){} };
                overlay.appendChild(header); overlay.appendChild(ta); overlay.appendChild(btnClose); document.body.appendChild(overlay);
                ta.select();
                // also create a download link
                const blob = new Blob([text], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'sharepoint_scan_result.json'; a.textContent = 'Download JSON result'; a.style.display = 'inline-block'; a.style.marginLeft = '12px'; overlay.appendChild(a);
                log('Overlay shown with JSON. Use Ctrl+C / Cmd+C to copy and close.');
            } catch(ee) {
                log('Failed to provide manual copy UI:', ee);
            }
        }

        return result;
    })();
})();
