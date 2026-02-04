const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log(">>> Gerando PDF de Exemplo (Layout Test)...");
    
    // 1. Tenta achar o Edge (mesma lógica do robô)
    const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    const edgeExe = edgePaths.find(p => fs.existsSync(p));

    if (!edgeExe) {
        console.error("Erro: Edge não encontrado para gerar o PDF.");
        return;
    }

    const browser = await chromium.launch({ executablePath: edgeExe });
    
    // 2. Cria imagens simuladas (Screenshots falsos)
    const page = await browser.newPage();
    
    console.log("Gerando imagem simulada 1 (Réplica Projudi)...");
    
    // Estilos baseados no print enviado (Header cinza, Links vermelhos)
    const estiloProjudi = `
        font-family: 'Verdana', sans-serif; 
        font-size: 11px;
        width: 100%;
        border-collapse: collapse;
    `;
    const estiloTH = `
        background-color: #dcdcdc;
        color: #333;
        font-weight: bold;
        text-align: center;
        padding: 4px;
        border: 1px solid #ccc;
    `;
    const estiloTD = `
        background-color: #f9f9f9;
        padding: 4px;
        border: 1px solid #ddd;
        text-align: center;
        color: #333;
    `;
    const linkRed = `color: #B00000; text-decoration: underline; cursor: pointer;`;
    const textRed = `color: #B00000; font-weight: bold;`;

    await page.setContent(`
        <div style="background:white; padding:10px;">
            <table style="${estiloProjudi}">
                <thead>
                    <tr>
                        <th style="${estiloTH} width:15%;">Nº do processo</th>
                        <th style="${estiloTH} width:30%;">Parte Intimada</th>
                        <th style="${estiloTH}">Data de Postagem</th>
                        <th style="${estiloTH}">Data de Recebimento</th>
                        <th style="${estiloTH}">Data de Cumprimento</th>
                        <th style="${estiloTH}">Data de Intimação Automática</th>
                        <th style="${estiloTH}"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="${estiloTD}"><span style="${linkRed}">0019976-86.2025.8.05.0103</span></td>
                        <td style="${estiloTD} text-align:left;">COMPANHIA DE ELETRICIDADE DO ESTADO DA BAHIA COELBA (Promovido)</td>
                        <td style="${estiloTD}">9 de Janeiro de 2026</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD} ${textRed}">21 de Janeiro de 2026</td>
                        <td style="${estiloTD}"><span style="${linkRed}">Visualizar</span></td>
                    </tr>
                    <tr>
                        <td style="${estiloTD}"><span style="${linkRed}">0020006-24.2025.8.05.0103</span></td>
                        <td style="${estiloTD} text-align:left;">COMPANHIA DE ELETRICIDADE DO ESTADO DA BAHIA COELBA (Promovido)</td>
                        <td style="${estiloTD}">9 de Janeiro de 2026</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD} ${textRed}">21 de Janeiro de 2026</td>
                        <td style="${estiloTD}"><span style="${linkRed}">Visualizar</span></td>
                    </tr>
                    <tr>
                        <td style="${estiloTD}"><span style="${linkRed}">0000069-32.2026.8.05.0088</span></td>
                        <td style="${estiloTD} text-align:left;">COMPANHIA DE ELETRICIDADE DO ESTADO DA BAHIA COELBA (Promovido)</td>
                        <td style="${estiloTD}">9 de Janeiro de 2026</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD} ${textRed}">21 de Janeiro de 2026</td>
                        <td style="${estiloTD}"><span style="${linkRed}">Visualizar</span></td>
                    </tr>
                    <!-- Mais linhas para volume -->
                    <tr>
                        <td style="${estiloTD}"><span style="${linkRed}">0219613-33.2025.8.05.0001</span></td>
                        <td style="${estiloTD} text-align:left;">COMPANHIA DE ELETRICIDADE DO ESTADO DA BAHIA COELBA (Promovido)</td>
                        <td style="${estiloTD}">9 de Janeiro de 2026</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD}">-</td>
                        <td style="${estiloTD} ${textRed}">21 de Janeiro de 2026</td>
                        <td style="${estiloTD}"><span style="${linkRed}">Visualizar</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `);
    const buff1 = await page.screenshot({ fullPage: true }); // Print completo do conteúdo
    
    // Sem segunda página, apenas uma para demonstração
    const screenshots = [buff1];
    
    // ... resto do código igual ...

    const categoryName = "CITAÇÕES (PREVIEW)";
    const filenameDate = "12.01.2026";
    const pdfPath = path.join(process.cwd(), "EXEMPLO_EVIDENCIAS.pdf");
    
    let htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: Segoe UI, sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #b30000; padding-bottom: 15px; }
                        .header h2 { margin: 0 0 10px 0; color: #b30000; text-transform: uppercase; }
                        .header p { margin: 5px 0; font-size: 14px; color: #666; }
                        
                        .page-container { page-break-after: always; margin-bottom: 50px; text-align: center; display: flex; flex-direction: column; align-items: center; }
                        .page-container:last-child { page-break-after: auto; }
                        
                        img { 
                            max-width: 100%; 
                            max-height: 850px; /* Limite para caber na A4 */
                            border: 1px solid #ccc; 
                            box-shadow: 3px 3px 8px rgba(0,0,0,0.15); 
                        }
                        
                        .footer { margin-top: 15px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 5px; width: 100%; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>EVIDÊNCIAS - ${categoryName}</h2>
                        <p>Data de Extração: ${new Date().toLocaleString()}</p>
                        <p>Período de Referência: ${filenameDate}</p>
                    </div>
    `;

    screenshots.forEach((buff, idx) => {
        const b64 = buff.toString('base64');
        htmlContent += `
            <div class="page-container">
                <img src="data:image/jpeg;base64,${b64}" />
                <div class="footer">Página ${idx + 1} capturada do Projudi</div>
            </div>
        `;
    });

    htmlContent += `</body></html>`;

    console.log("Renderizando PDF final...");
    const pdfPage = await browser.newPage();
    await pdfPage.setContent(htmlContent);
    await pdfPage.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();
    console.log(`\n>>> SUCESSO! Abra o arquivo: ${pdfPath}`);
})();