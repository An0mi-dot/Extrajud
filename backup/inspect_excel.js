const ExcelJS = require('exceljs');
const path = require('path');

async function inspect() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, 'Ex', 'CITAÇÕES E INTIMAÇÕES PROJUDI 07.01.2026.xlsx');
    
    console.log(`Lendo arquivo: ${filePath}`);
    await workbook.xlsx.readFile(filePath);
    
    console.log("Worksheets:", workbook.worksheets.map(w => w.name));
    
    const ws = workbook.worksheets[0]; // Pega a primeira que existir
    if (!ws) {
        console.log("Planilha não encontrada.");
        return;
    }

    const row1 = ws.getRow(1);
    const cellA1 = row1.getCell(1);

    console.log("--- ESTILOS DA LINHA 1 (CABEÇALHO) ---");
    console.log("Font:", JSON.stringify(cellA1.font, null, 2));
    console.log("Fill:", JSON.stringify(cellA1.fill, null, 2));
    console.log("Border:", JSON.stringify(cellA1.border, null, 2));
    console.log("Alignment:", JSON.stringify(cellA1.alignment, null, 2));
    console.log("Height:", row1.height);
}

inspect();