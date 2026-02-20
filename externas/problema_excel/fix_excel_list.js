const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function fixExcelList() {
    const filePath = path.join(__dirname, 'Cópia de TABELA DOCUMENTOS (2 parte).xlsx');
    const listPath = path.join(__dirname, 'Explicação.txt');

    console.log('Starting Fix Script...');

    if (!fs.existsSync(filePath)) {
        console.error('Excel file not found at:', filePath);
        return;
    }
    if (!fs.existsSync(listPath)) {
        console.error('List file not found at:', listPath);
        return;
    }

    // 1. Parse List
    const rawContent = fs.readFileSync(listPath, 'utf-8');
    const allLines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    // Find list start (Looking for "MP faturas...")
    const startIdx = allLines.findIndex(line => line.includes("MP faturas abril/2010 1/2 1 Caixa"));
    
    let cleanList = [];
    if (startIdx === -1) { 
        console.warn('Marker "MP faturas..." not found. Using entire file content as list (minus headers if any).');
        // Heuristic: If marker not found, check if first few lines look like instructions "Eu preciso..."
        // For now, let's assume if marker missing, use all lines that are not instructions.
        cleanList = allLines.filter(l => !l.startsWith("Eu preciso") && !l.startsWith("Essa lista") && !l.startsWith("O nome da") && !l.startsWith("Aqui está"));
    } else {
        cleanList = allLines.slice(startIdx);
    }
    
    console.log(`Parsed ${cleanList.length} items from text file.`);

    // 2. Open Workbook
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
    } catch (e) {
        console.error('Error reading Excel file:', e);
        return;
    }
    
    // Get Sheet
    // Try precise name or trimmed name, fallback to index 1
    let sheet = workbook.getWorksheet('Pedido de Arquivamento');
    if (!sheet) {
        sheet = workbook.worksheets.find(s => s.name.trim() === 'Pedido de Arquivamento') || workbook.worksheets[1];
    }
    
    if (!sheet) {
        console.error('Sheet "Pedido de Arquivamento" not found');
        return;
    }

    const TARGET_COL = 7; // G
    const START_ROW = 7; 
    
    console.log(`Processing list items starting at Excel Row ${START_ROW}.`);

    // 3. Fill/Update cells
    for (let i = 0; i < cleanList.length; i++) {
        const item = cleanList[i];
        const currentRow = START_ROW + i;
        const row = sheet.getRow(currentRow);
        const cell = row.getCell(TARGET_COL);
        
        // Update to match the list exactly
        cell.value = item;
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
    }
    
    // 4. Cleanup Artifacts (if any, from previous runs)
    // We expect valid data to have other columns filled (Col 2, 3 etc). 
    // If we find rows at the bottom that ONLY have Col 7, we delete/clear them.
    
    const lastRow = sheet.rowCount;
    // We start checking after the appended list
    const firstCheckRow = START_ROW + cleanList.length;
    
    console.log(`Checking for artifacts from row ${firstCheckRow} to ${lastRow}...`);
    
    let cleanedCount = 0;
    for (let r = firstCheckRow; r <= lastRow + 20; r++) {
         const row = sheet.getRow(r);
         const val7 = row.getCell(TARGET_COL).value;
         // Check if other columns (2,3,4) are empty
         const hasOtherData = row.getCell(2).value || row.getCell(3).value || row.getCell(4).value;
         
         if (val7 && !hasOtherData) {
             // It's likely an artifact (duplicate append)
             row.getCell(TARGET_COL).value = null;
             cleanedCount++;
         }
    }
    
    if (cleanedCount > 0) {
        console.log(`Removed ${cleanedCount} artifact rows.`);
    }

    await workbook.xlsx.writeFile(filePath);
    console.log('File saved.');
}

fixExcelList().catch(e => console.error(e));
