const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração
const SHAREPOINT_ROOT_URL = "https://iberdrola.sharepoint.com/sites/JUDCOELBA/Shared%20Documents/Forms/AllItems.aspx";
const DEFAULT_PREFIX = "OFICIO ";

// Utilitário de Leitura do Terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
    console.log("==========================================");
    console.log("   CRIADOR DE PASTAS SEQUENCIAIS - PJE    ");
    console.log("==========================================");

    // 1. Encontrar Edge
    const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    const edgeExe = edgePaths.find(p => fs.existsSync(p));
    if (!edgeExe) {
        console.error("ERRO: Microsoft Edge não encontrado.");
        process.exit(1);
    }

    // 2. Launch (Headed para Login)
    console.log("> Iniciando navegador (Faça login se solicitado)...");
    const browser = await chromium.launch({
        executablePath: edgeExe,
        headless: false, // Precisa ser visible para login SSO da empresa
        args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
    });
    
    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    // 3. Navegar
    try {
        console.log(`> Acessando: ${SHAREPOINT_ROOT_URL}`);
        // URL Específica da pasta de "Criação de Pastas"
        await page.goto("https://iberdrola.sharepoint.com/sites/JUDCOELBA/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FJUDCOELBA%2FShared%20Documents%2FCria%C3%A7%C3%A3o%20de%20Pastas&viewid=b0389131%2Db788%2D4354%2D8edd%2Dcfe27a229f93", { timeout: 120000, waitUntil: 'domcontentloaded' });
    } catch(e) {
        console.error("Erro na navegação ou timeout:", e.message);
    }

    // 4. Aguardar Login e Carregamento
    console.log(">> Aguardando carregamento da lista de arquivos...");
    
    // Tenta detectar a lista de arquivos
    try {
        // Seletor genérico para itens do SharePoint moderno
        await page.waitForSelector('div[role="row"], .ms-List-cell', { timeout: 300000 }); // 5 min para login
    } catch(e) {
        console.log("Tempo de espera excedido. Continuando mesmo assim...");
    }

    console.log("\n[!] Se a página carregou, podemos prosseguir.");
    
    // 5. Perguntar quantidade
    const countStr = await ask("\nQuantas pastas deseja criar? (Apenas números): ");
    const count = parseInt(countStr);

    if (isNaN(count) || count <= 0) {
        console.log("Quantidade inválida. Encerrando.");
        await browser.close();
        process.exit(0);
    }

    console.log(`\n> Iniciando criação de ${count} pastas sequenciais...`);

    // 6. Lógica de Criação (Simplificada do sharepoint_service.js)
    let created = 0;
    
    try {
        // Obter último número
        const items = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('div[role="row"]'));
            return rows.map(r => {
                const nameDiv = r.querySelector('.ms-List-cell[data-automation-key="name"] a') || r.querySelector('span.signalField_491295e4');
                return nameDiv ? nameDiv.innerText.trim() : "";
            });
        });

        // Filtrar números existentes
        let maxNum = 0;
        const regex = /OFICIO\s+(\d+)/i;
        items.forEach(it => {
            const m = it.match(regex);
            if (m) {
                const n = parseInt(m[1]);
                if (n > maxNum) maxNum = n;
            }
        });

        console.log(`> Última pasta detectada: OFICIO ${maxNum}`);
        let current = maxNum + 1;

        for (let i = 0; i < count; i++) {
            const folderName = `OFICIO ${current}`;
            process.stdout.write(`Creating ${folderName}... `);

            // Clicar em Novo -> Pasta
            // Botão "Novo"
            const btnNew = page.locator('button[name="Novo"], button[name="New"], button[data-automation-id="newItemCommand"]');
            await btnNew.click();
            
            // Opção "Pasta" no menu
            const menuFolder = page.locator('button[name="Pasta"], button[name="Folder"], li[name="Pasta"]');
            await menuFolder.click();

            // Input Nome
            const input = page.locator('input[id*="folderName"], input.ms-TextField-field');
            await input.waitFor();
            await input.fill(folderName);
            
            // Botão Criar
            const btnCreate = page.locator('button.ms-Button--primary, button:has-text("Criar")');
            await btnCreate.click();

            // Aguardar desaparecer dialog
            await btnCreate.waitFor({ state: 'hidden', timeout: 10000 });
            await page.waitForTimeout(1000); // Segurança

            console.log("OK");
            current++;
            created++;
        }

    } catch (err) {
        console.error("\nERRO DURANTE O PROCESSO:", err.message);
    }

    console.log(`\nProcesso finalizado. ${created} pastas criadas.`);
    await ask("Pressione ENTER para sair...");
    
    await browser.close();
    process.exit(0);
}

main();
