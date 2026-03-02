const ExcelJS = require('exceljs');
const path = require('path');

// Raw string for Windows path to avoid escaping issues
const filePath = String.raw`c:\Users\B624140\Desktop\PROG\EXTRATJUD\modelos\modelos_fluxo\NNA - Expedientes Captados - 20260227.xlsx`;

async function readHeaders() {
    console.log(`Reading file: ${filePath}`);
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[0]; // Assume first sheet
        if (!worksheet) {
            console.log("No worksheet found");
            process.exit(1);
        }
        
        const firstRow = worksheet.getRow(1);
        const headers = [];
        firstRow.eachCell((cell, colNumber) => {
            headers.push(cell.value);
        });

        console.log("HEADERS_FOUND:", JSON.stringify(headers));
        process.exit(0);

    } catch (error) {
        console.error("Error reading file:", error);
        process.exit(1);
    }
}

readHeaders();
