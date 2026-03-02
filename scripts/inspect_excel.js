const ExcelJS = require('exceljs');
const { app } = require('electron');
const path = require('path');

async function inspect(app) {
    if (!app) return; // Only run if app instance provided to ensure correct context
    console.log('\n\n=== START EXCEL INSPECTION ===');
    const workbook = new ExcelJS.Workbook();
    // Path relative to where electron is run (project root)
    const filePath = path.join(app.getAppPath(), 'modelos', 'modelos_fluxo', 'NNA - Expedientes Captados - 20260227.xlsx');
    
    try {
        console.log(`Reading file at: ${filePath}`);
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0]; // Get first sheet
        
        if (!worksheet) {
            console.log('No worksheet found!');
            return;
        }

        console.log(`Sheet Name: ${worksheet.name}`);
        console.log(`Total Rows: ${worksheet.rowCount}`);
        
        // Assume header is row 1
        const headerRow = worksheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell, colNumber) => {
            headers.push({ col: colNumber, value: cell.value });
        });
        
        console.log('--- HEADERS FOUND ---');
        headers.forEach(h => console.log(`[Col ${h.col}] ${h.value}`));
        
        // Print first row of data to see values
        console.log('\n--- SAMPLE DATA (ROW 2) ---');
        const row2 = worksheet.getRow(2);
        const rowData = {};
        row2.eachCell((cell, colNumber) => {
            const header = headers.find(h => h.col === colNumber);
            if (header) {
                rowData[header.value] = cell.value;
            }
        });
        console.log(JSON.stringify(rowData, null, 2));
        
        console.log('=== END EXCEL INSPECTION ===\n\n');
        
    } catch (error) {
        console.error('Error in inspection:', error);
    }
    
    // Force quit after inspection so we don't start the full app
    app.quit();
}

module.exports = inspect;

