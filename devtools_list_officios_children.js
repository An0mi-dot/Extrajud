(function(){
    // DevTools snippet: run this on the OFÍCIOS 2026 page.
    // Usage: paste and execute in Console. If you have a selector for the OFÍCIOS element, set `rootSelector` variable.

    const rootSelector = "div.listHeader_bd3c98dd:nth-child(1) > div.content_a8d04bd6:nth-child(1) > div.info_a8d04bd6.titleWithoutSiteName_a8d04bd6:nth-child(1) > div.titleRow_a8d04bd6:nth-child(1) > div.breadcrumbRoot_f3b7fa20:nth-child(1) > div.breadcrumbRoot_932ae0d1:nth-child(1) > ol.breadcrumbList_932ae0d1:nth-child(2) > li.breadcrumbListItem_932ae0d1:nth-child(2) > h2.breadcrumbHeadingWrapper_932ae0d1:nth-child(1) > div.breadcrumbNonNavigableItem_932ae0d1:nth-child(1)";

    function safeText(el){ try { return (el && el.innerText) ? el.innerText.trim() : ''; } catch(e){ return ''; } }
    function elementPath(el){ try { if(!el) return ''; const path=[]; let cur=el, depth=0; while(cur && cur.nodeType===1 && depth++<12){ let part=cur.tagName.toLowerCase(); if(cur.id) part += `#${cur.id}`; else if(cur.className) part += `.${(cur.className||'').toString().split(/\s+/).slice(0,3).join('.')}`; const sib = Array.from(cur.parentNode?cur.parentNode.children:[]).indexOf(cur)+1; part += `:nth-child(${sib})`; path.unshift(part); cur = cur.parentNode; } return path.join(' > '); } catch(e){ return ''; } }

    // Try to find the root element
    const rootEl = document.querySelector(rootSelector) || Array.from(document.querySelectorAll('div, section')).find(d => safeText(d).toUpperCase().includes('OFÍCIOS') && safeText(d).match(/OF[IÍ]CIOS\s*\d{4}/i));

    if(!rootEl){ console.warn('Root element not found. Ensure you are on the OFÍCIOS folder view and the selector is correct.'); return { ok:false, error:'root_not_found' }; }

    // Look for a nearby container that holds the list/grid of items
    // Heuristics: nearest ancestor with class 'Files-main', or find the next sibling with role='grid' or div that contains rows
    function findListContainer(el){
        let anc = el;
        for(let i=0;i<8 && anc; i++){ if(anc.className && /(Files-main|Files-mainColumn|ms-Grid|listView|ms-List)/i.test(anc.className)) return anc; anc = anc.parentElement; }
        // search descendants of body for grid
        let grid = document.querySelector('[role="grid"], [role="table"], div.ms-List, table[role="grid"]');
        if(grid) return grid;
        // fallback: look for nearest div that contains rows with text 'Nome' header
        const candidates = Array.from(document.querySelectorAll('div')).filter(d => safeText(d).toLowerCase().includes('nome') && d.querySelectorAll && d.querySelectorAll('div, a, span').length>5);
        if(candidates.length>0) return candidates[0];
        // last resort: the root element's grandparent
        return rootEl.closest('div') || document.body;
    }

    const listContainer = findListContainer(rootEl);

    // Attempt to extract rows/items inside listContainer
    // Look for elements with role row, or elements with class 'ms-List-cell', or anchors inside
    const rows = Array.from(listContainer.querySelectorAll('[role="row"], [role="listitem"], .ms-List-cell, div[role="gridcell"], tr')).slice(0,1000);

    const items = [];
    const seen = new Set();
    for(const r of rows){
        try{
            // Try to infer a name: check common places (a, span, div with class name, or innerText)
            let name = '';
            const a = r.querySelector('a.ms-Link, a[role="link"], a[href]');
            if(a && a.innerText && a.innerText.trim().length>0) name = a.innerText.trim();
            if(!name){
                const s = r.querySelector('span, div');
                if(s && s.innerText && s.innerText.trim().length>0) name = s.innerText.trim();
            }
            if(!name) name = safeText(r).split('\n').map(l=>l.trim()).find(l=>l.length>0) || '';
            if(!name) continue;
            if(seen.has(name)) continue;
            seen.add(name);
            // Determine if row is a folder: look for aria-label/title containing 'pasta' or 'folder', or icon elements with folder alt text
            let isFolder = false;
            const aria = r.getAttribute && (r.getAttribute('aria-label') || r.getAttribute('role') || r.getAttribute('title')) || '';
            if(/pasta|folder/i.test(aria)) isFolder = true;
            // Icon check
            if(!isFolder){
                const icon = r.querySelector('svg, img, i');
                if(icon){ const alt = (icon.getAttribute && (icon.getAttribute('alt') || icon.getAttribute('title') || '')) || ''; if(/folder|pasta/i.test(alt)) isFolder = true; }
            }
            // href if available
            const href = (a && (a.href || a.getAttribute('href'))) || null;
            items.push({ name, isFolder, href, selector: elementPath(r) });
        } catch(e){ /* ignore row parse error */ }
    }

    // Post-filter: keep items that look like folders (or all if none identified)
    const folders = items.filter(i => i.isFolder || /^OF[IÍ]CIOS\s*\d{4}/i.test(i.name) || i.name.length<200).slice(0,500);

    const result = { ok:true, rootSelector: rootSelector, rootText: safeText(rootEl), containerSelector: elementPath(listContainer), totalItems: items.length, folders, sampleItems: items.slice(0,50) };

    // Copy to clipboard if possible
    try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(JSON.stringify(result,null,2)).then(()=> console.log('Result copied to clipboard'), ()=> console.log('Clipboard copy failed.')); } } catch(e){ }

    console.log('--- OFÍCIOS CHILDREN SCAN ---');
    console.log('Root:', result.rootText);
    console.log('Container selector:', result.containerSelector);
    console.log('Total rows inspected:', result.totalItems);
    console.log('Folders detected (preview):', result.folders.slice(0,30));

    return result;
})();