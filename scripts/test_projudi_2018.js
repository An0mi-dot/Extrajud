const { chromium } = require('playwright-core');
const fs = require('fs');
const cheerio = require('cheerio');

const PROJUDI_BASE = "https://projudi.tjba.jus.br/projudi";

// Find Edge Helper
async function findEdge() {
    const commonPaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

// --- RECURSIVE FRAME FINDER ---
async function findFrame(page, conditionFn) {
    const frames = page.frames();
    for (const frame of frames) {
        try {
            if (await conditionFn(frame)) return frame;
        } catch (e) { /* ignore cross-origin errors */ }
    }
    return null;
}

async function runHybridExtraction() {
    console.log("=== EXTRAÇÃO HÍBRIDA PROJUDI: ARQUIVADOS (2018) ===");

    const executablePath = await findEdge();
    if (!executablePath) {
        console.error("Navegador não encontrado.");
        return;
    }

    console.log("1. Iniciando Login (Modo Stealth)...");
    const browser = await chromium.launch({
        executablePath,
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--start-maximized' 
        ]
    });

    const context = await browser.newContext({
        viewport: null
    });

    const page = await context.newPage();

    try {
        console.log("Acessando página de login...");
        // Increased timeout to 60s
        try {
            await page.goto(PROJUDI_BASE + "/", { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (e) {
            console.log("Erro de navegação inicial, tentando ignorar e prosseguir...", e.message);
        }
        
        console.log("Navegação iniciada. Aguardando conteúdo...");
        await page.waitForTimeout(3000);

        // -- LOGIN AUTOMÁTICO (Baseado em automacao_service.js) --
        console.log("Procurando campos de login (input#login, input#senha) em todos os frames...");
        
        let loginFrame = null;
        let userInput = null;
        let passInput = null;

        // Tenta encontrar por 15 segundos
        for (let i = 0; i < 15; i++) {
            const frames = page.frames();
            for (const f of frames) {
                try {
                    const u = f.locator('input#login'); // Seletor do serviço original
                    const p = f.locator('input#senha');
                    if (await u.count() > 0 && await p.count() > 0) {
                        loginFrame = f;
                        userInput = u;
                        passInput = p;
                        break;
                    }
                } catch(e) {}
            }
            if (loginFrame) break;
            await page.waitForTimeout(1000);
        }

        if (loginFrame) {
             console.log("Campos encontrados! Preenchendo...");
             await userInput.fill('05296357558.rep');
             await page.waitForTimeout(300);
             await passInput.fill('neocoelba@2023');
             console.log("Credenciais inseridas. Pressionando Enter...");
             await passInput.press('Enter');
        } else {
             console.log("Campos de login NÃO encontrados. Verifique se já está logado ou Captcha.");
        }
        
        console.log("Aguardando carregamento pós-login...");
        await page.waitForTimeout(5000);

        // --- LOOP DE SELEÇÃO DE PERFIL / ORGÃO ---
        console.log("Procurando 'REPRESENTAÇÃO COELBA' ou Dashboard...");
        let logged = false;
        const startWait = Date.now();
        
        while (!logged && (Date.now() - startWait < 60000)) { // 1 min timeout
            const frames = page.frames();

            // 1. Tenta clicar Representação
            for (const frame of frames) {
                try {
                    // Regex flexível
                    const btn = frame.locator("a").filter({ hasText: /REPRESENTA.ÃO\s+COELBA/i }).first();
                    if (await btn.count() > 0 && await btn.isVisible()) {
                        console.log(">>> Botão 'REPRESENTAÇÃO COELBA' detectado. Clicando...");
                        await btn.click();
                        console.log("Aguardando estabilização (10s)...");
                        await page.waitForTimeout(10000); 
                        logged = true;
                        break;
                    }
                } catch (e) {}
            }
            if (logged) break;

            // 2. Verifica se já está no Dashboard
            const main = page.frames().find(f => f.name() === 'mainFrame');
            if (main) {
                // Se mainFrame existe e tem conteúdo, assumimos logado
                try {
                    if (await main.locator('body').count() > 0) {
                         logged = true;
                         console.log(">>> MainFrame detectado. Login assumido.");
                         break;
                    }
                } catch(e) {}
            }

            await page.waitForTimeout(1000);
        }

        // Fallback wait if not fully confirmed
        await page.waitForTimeout(2000);

        console.log("Login OK. Aguardando estabilização (5s)...");
        await page.waitForTimeout(5000);

        // --- SELEÇÃO DE ÓRGÃO ---
        console.log('2. Verificando Seleção de Órgão...');
        
        // Retry logic for finding right frame
        let targetFrame = null;
        for(let i=0; i<5; i++) {
            targetFrame = await findFrame(page, async (f) => {
                const url = f.url();
                if (url.includes('captcha') || url.includes('turing')) return false;
                
                // Generic check for Projudi internal frames
                try {
                    if (await f.$('select[name="codComarca"]')) return true;
                    if (await f.$('a[href*="submitForm"]')) return true;
                } catch(e) {}
                
                return false;
            });
            
            if (targetFrame) break;
            await page.waitForTimeout(2000);
        }

        if (targetFrame) {
            console.log(`Frame de Órgão encontrado: ${targetFrame.url()}`);
            try { 
                await targetFrame.waitForLoadState('domcontentloaded');
                
                const comarcaSelect = targetFrame.locator('select[name="codComarca"]');
                if (await comarcaSelect.count() > 0) {
                        await comarcaSelect.selectOption('-1');
                        await page.waitForTimeout(500);
                }
                const orgaoLink = targetFrame.locator('a[href*="submitForm"]');
                if (await orgaoLink.count() > 0) {
                    await orgaoLink.first().click();
                    console.log('Selecionou órgão. Aguardando...');
                    await page.waitForTimeout(4000);
                }
            } catch(e) { console.log("Info: " + e.message); }
        } else {
            console.log("Nenhum frame novo encontrado. Assumindo que já está no painel.");
        }

        // --- FILTRAR ARQUIVADOS 2018 ---
        console.log("3. Navegando para Arquivados e aplicando Filtro (2018)...");
        const ARQUIVADOS_URL = `${PROJUDI_BASE}/listagens/ProcessosParte?tipo=arquivados&isParteOrgaoRep=true`;

        // Force navigation on main page if possible, otherwise goto
        await page.goto(ARQUIVADOS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Wait for frame with correct form
        let contentFrame = null;
        console.log("Procurando formulário de filtro...");
        
        for(let i=0; i<15; i++) { // Retry for 30s
             contentFrame = await findFrame(page, async (f) => {
                 try {
                    return (await f.$('form#formEnvia')) !== null;
                 } catch(e) { return false; }
             });
             if (contentFrame) break;
             console.log(`Tentativa ${i+1}: Aguardando frame com '#formEnvia'...`);
             await page.waitForTimeout(2000);
        }

        if (!contentFrame) {
            // Debug: print all frames
            const allFrames = page.frames().map(f => f.url());
            console.log("Frames disponíveis:", allFrames);
            throw new Error("Não foi possível encontrar o formulário de filtro (#formEnvia).");
        }

        console.log(`Frame de conteúdo identificado: ${contentFrame.url()}`);
        console.log("Aplicando datas: 01/01/2018 a 31/12/2018...");
        
        // Injeta JS para preencher e submeter o formulário
        await contentFrame.evaluate(() => {
             const f = document.querySelector('form#formEnvia'); 
             if (f) {
                 const iIni = f.querySelector('input[name="dataInicio"]');
                 const iFim = f.querySelector('input[name="dataFim"]');
                 const iPag = f.querySelector('input[name="pagina"]');
                 
                 if (iIni) iIni.value = '01/01/2018';
                 if (iFim) iFim.value = '31/12/2018';
                 if (iPag) iPag.value = '1';
                 
                 f.submit();
                 return true;
             } 
             return false;
        });

        console.log("Filtro enviado. Aguardando resultados...");
        // Wait for significant change or load
        await page.waitForTimeout(5000);
        await contentFrame.waitForLoadState('domcontentloaded');

        // --- PARSEAR RESULTADOS ---
        console.log("4. Extraindo dados...");
        const html = await contentFrame.content();
        fs.writeFileSync('debug_arquivados_2018.html', html);
        console.log("HTML salvo em debug_arquivados_2018.html");
        
        const $ = cheerio.load(html);
        
        // Tenta achar o contador total
        const bodyText = $('body').text();
        const found = bodyText.match(/(\d+)\s+resultados encontrados/);
        console.log(`\n=== RESULTADO ===`);
        if (found) {
            console.log(`Total encontrado: ${found[1]}`);
        } else {
            console.log("Contagem total não encontrada no texto visível.");
        }

        // Lista processos da primeira página
        let count = 0;
        $('tr').each((i, row) => {
            const txt = $(row).text().trim();
            if (txt.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)) {
                count++;
                if (count <= 3) console.log(`Ex: ${txt.replace(/\s+/g,' ').substring(0,80)}...`);
            }
        });
        console.log(`Processos listados nesta página: ${count}`);

    } catch (err) {
        console.error("Erro Fatal:", err);
    } finally {
        console.log("Fechando navegador...");
        await browser.close();
    }
}

runHybridExtraction();
