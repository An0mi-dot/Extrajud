const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// URL do Projudi
const PROJUDI_URL = "https://projudi.tjba.jus.br/projudi/";

async function findEdge() {
    const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    return edgePaths.find(p => fs.existsSync(p));
}

async function runInspection() {
    console.log("=== INSPEÇÃO DE API PROJUDI ===");
    
    const edgeExe = await findEdge();
    if (!edgeExe) {
        console.error("Erro: Microsoft Edge não encontrado nos locais padrão.");
        process.exit(1);
    }
    console.log(`Buscando Edge em: ${edgeExe}`);

    // Launch browser
    const browser = await chromium.launch({
        executablePath: edgeExe,
        headless: false,
        args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
    });

    const context = await browser.newContext({
        viewport: null,
        recordHar: {
            path: 'projudi_traffic.har',
            mode: 'full', // Grava corpo da resposta também
            content: 'embed'
        }
    });

    // Anti-detecção básica
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();

    console.log(`Navegando para: ${PROJUDI_URL}`);
    console.log("Navegador aberto. Por favor, FAÇA O LOGIN manualmente e realize uma consulta processual.");
    console.log("O tráfego de rede está sendo gravado em 'projudi_traffic.har'.");
    console.log("Quando terminar, FECHE O NAVEGADOR para salvar o arquivo.");

    try {
        await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Espera o navegador fechar
        await page.waitForEvent('close', { timeout: 0 }); // Espera infinita até fechar
    } catch (e) {
        // Ignora erro se for fechamento do browser
        if (!e.message.includes('Target closed') && !e.message.includes('browser has been closed')) {
            console.error("Erro durante a navegação:", e);
        }
    } finally {
        console.log("Fechando contexto e salvando HAR...");
        await context.close();
        await browser.close();
        console.log("Processo finalizado. Verifique o arquivo 'projudi_traffic.har' na raiz.");
    }
}

runInspection().catch(console.error);
