const fs = require('fs');
const path = require('path');

// Helper to remove existing modal content blocks
function cleanContent(content, startMarkerPattern, endMarkerPattern) {
    const startRegex = new RegExp(startMarkerPattern);
    const endRegex = new RegExp(endMarkerPattern);
    
    const startMatch = content.match(startRegex);
    if (!startMatch) return content;
    
    const remaining = content.substring(startMatch.index + startMatch[0].length);
    const endMatch = remaining.match(endRegex);
    
    if (!endMatch) return content;
    
    const startIndex = startMatch.index; // Include the marker itself to replace it cleanly? 
    // Actually we want to KEEP the start marker usually, but my new template includes the wrapper div.
    // The markers in HTML are comments.
    // My template starts with <div id="modal-settings"...
    
    // Let's replace FROM start marker TO end marker, but KEEP end marker.
    // And insert the template.
    
    return {
        pre: content.substring(0, startMatch.index),
        post: content.substring(startMatch.index + startMatch[0].length + endMatch.index)
    };
}

const templatePath = path.join(__dirname, 'public', 'settings_modal_template.html');
const template = fs.readFileSync(templatePath, 'utf8');

const files = [
    {
        path: 'public/hub_subsidios.html',
        markerStart: /<!-- ─── SETTINGS MODAL ─+ -->/,
        markerEnd: /<!-- ─── SCRIPTS ─+ -->/
    },
    {
        path: 'public/index.html', 
        markerStart: /<!-- Settings Modal \(New\) -->/, // In index.html
        markerEnd: /<!-- Scripts Logic -->/
    },
    {
        path: 'public/hub_servicos.html',
        markerStart: /<!-- Settings Modal -->/,
        markerEnd: /<style>/
    }
];

files.forEach(fileDef => {
    const filePath = path.join(__dirname, fileDef.path);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${fileDef.path} (not found)`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    const startMatch = content.match(fileDef.markerStart);
    if (!startMatch) {
        console.log(`Marker not found in ${fileDef.path}`);
        return;
    }
    
    const remaining = content.substring(startMatch.index + startMatch[0].length);
    const endMatch = remaining.match(fileDef.markerEnd);
    
    if (!endMatch) {
         console.log(`End marker not found in ${fileDef.path}`);
         return;
    }
    
    const startIndex = startMatch.index;
    const endIndex = startMatch.index + startMatch[0].length + endMatch.index;
    
    // Construct new content:
    // [Start of file]
    // [Start Marker] (We keep the marker to maintain structure? Or replace it?)
    // Actually, let's keep the Start Marker comment if it makes sense, but the template doesn't include it.
    // Let's look at the markers.
    // hub_subsidios: <!-- ─── SETTINGS MODAL ─── -->
    // index: <!-- Settings Modal (New) -->
    
    // I will replace [Start Marker]...[End Marker] (exclusive of end marker)
    // with: [Start Marker]\n[Template]\n
    
    const newContent = content.substring(0, startIndex) + 
                       startMatch[0] + '\n' + 
                       template + '\n' + 
                       content.substring(endIndex);
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${fileDef.path}`);
});
