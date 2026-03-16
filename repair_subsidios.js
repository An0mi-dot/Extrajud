const fs = require('fs');
const path = require('path');

// 1. Get the Source of Truth: hub_servicos.html
const servicosPath = path.join(__dirname, 'public', 'hub_servicos.html');
const servicosContent = fs.readFileSync(servicosPath, 'utf8');

// Extract Modal Settings HTML
const modalSettingsStart = servicosContent.indexOf('<div id="modal-settings"');
// Find closing div for modal-settings. It's properly indented in the file.
// We can validly assume it ends before the <style> that follows it or the next script.
// Looking at the file content:
// <div id="modal-settings" ...
// ...
// </div>
// </div>
// <style>
const modalSettingsEnd = servicosContent.indexOf('<style>', modalSettingsStart); 
const modalSettingsHTML = servicosContent.substring(modalSettingsStart, modalSettingsEnd).trim();

// Extract Modal Admin Roles HTML
const modalAdminStart = servicosContent.indexOf('<div id="modal-admin-roles"');
const modalAdminEnd = servicosContent.indexOf('<script type="module">', modalAdminStart);
const modalAdminHTML = servicosContent.substring(modalAdminStart, modalAdminEnd).trim();

// Extract Settings Script
// It's the script block that starts with (function() { const { ipcRenderer } ... right after the <style> tag after modal-settings.
const scriptStart = servicosContent.indexOf('<script>', modalSettingsEnd); 
// actually checking read_file output:
// <style> ... </style> 
// <script> 
// (function() { const { ipcRenderer } ...
const settingsScriptStart = servicosContent.indexOf('<script>', modalSettingsEnd);
const settingsScriptEnd = servicosContent.indexOf('</script>', settingsScriptStart) + 9;
const settingsScript = servicosContent.substring(settingsScriptStart, settingsScriptEnd).trim();


// Helper to fix a target file
function fixFile(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    
    let content = fs.readFileSync(targetPath, 'utf8');

    // 1. Clean Garbage at top (if any)
    const doctypeIdx = content.toLowerCase().indexOf('<!doctype html>');
    if (doctypeIdx > 0) {
        content = content.substring(doctypeIdx);
        console.log(`Cleaned garbage from ${targetPath}`);
    }

    // 2. Remove old modals (modal-settings, modal-admin-logic, modal-admin-roles)
    // We remove by ID regex to be safe-ish, or just strip them if we know they are at the end.
    // Since we appended them at the end in previous fix, we can try to find them and cut.
    
    const idsToRemove = ['modal-settings', 'modal-admin-logic', 'modal-admin-roles'];
    
    // Naive removal: find the ID, find the closing tag?
    // Better: Remove everything from the first occurrence of these modals till the end of body?
    // But we might have other things.
    // Let's use the same logic as before: remove by cleaning string ranges.
    
    for (const id of idsToRemove) {
        const marker = `id="${id}"`;
        let idx = content.indexOf(marker);
        if (idx === -1) idx = content.indexOf(`id='${id}'`);
        
        while (idx !== -1) {
            // Find the opening <div before this ID
            const openDivIdx = content.lastIndexOf('<div', idx);
            if (openDivIdx !== -1) {
                 // We need to match opening/closing divs to remove the whole block
                 let balance = 1;
                 let scan = content.indexOf('>', base = openDivIdx) + 1;
                 while (balance > 0 && scan < content.length) {
                     const nextOpen = content.indexOf('<div', scan);
                     const nextClose = content.indexOf('</div>', scan);
                     
                     if (nextClose === -1) break; // error
                     
                     if (nextOpen !== -1 && nextOpen < nextClose) {
                         balance++;
                         scan = nextOpen + 4;
                     } else {
                         balance--;
                         scan = nextClose + 6;
                     }
                 }
                 
                 if (balance === 0) {
                     // Remove from openDivIdx to scan
                     console.log(`Removing ${id} block from ${targetPath}`);
                     content = content.substring(0, openDivIdx) + content.substring(scan);
                 }
            }
            // Check for another occurrence
            idx = content.indexOf(marker);
            if (idx === -1) idx = content.indexOf(`id='${id}'`);
        }
    }

    // 3. Remove old Script if it matches our Settings Script (to avoid duplication check?)
    // Hard to detect old script specifically. But we know `fix_modals.js` didn't add it.
    // If there is an existing script for settings, we might duplicate it.
    // However, the user said it DOES NOT WORK, so likely it's missing.
    // Let's just append the new logic.
    
    // 4. Append New Modals and Script before </body>
    const insertionPoint = content.lastIndexOf('</body>');
    if (insertionPoint !== -1) {
        const newBlock = `
<!-- ─── INJECTED SETTINGS MODAL (Standardized) ─── -->
${modalSettingsHTML}

${modalAdminHTML}

<!-- ─── INJECTED SETTINGS SCRIPT ─── -->
${settingsScript}
`;
        content = content.substring(0, insertionPoint) + newBlock + content.substring(insertionPoint);
    }
    
    fs.writeFileSync(targetPath, content);
    console.log(`Updated ${targetPath} successfully.`);
}

// Fix hub_subsidios.html
fixFile(path.join(__dirname, 'public', 'hub_subsidios.html'));

// Fix index.html (just in case)
fixFile(path.join(__dirname, 'public', 'index.html'));

console.log('Repair complete.');
