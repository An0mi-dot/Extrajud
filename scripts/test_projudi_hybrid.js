const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // Use installed cheerio

// URL Base
const PROJUDI_BASE = "https://projudi.tjba.jus.br/projudi";

// Função auxiliar para encontrar o Edge (reaproveitada)
async function findEdge() {
    const edgePaths = [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ];
    return edgePaths.find(p => fs.existsSync(p));
}

async function runHybridExtraction() {
    console.log("=== EXTRAÇÃO HÍBRIDA PROJUDI: ARQUIVADOS ===");
    
    // 1. LOGIN COM BROWSER (Para passar pelo Captcha/Tencent)
    const edgeExe = await findEdge();
    if (!edgeExe) { console.error("Edge não encontrado."); process.exit(1); }

    console.log("1. Iniciando Login via Navegador (Modo Stealth)...");
    
    // Configuração Anti-Detecção Reforçada
    const browser = await chromium.launch({
        executablePath: edgeExe,
        headless: false,
        args: [
            "--start-maximized", 
            "--disable-blink-features=AutomationControlled", // Remove navigator.webdriver
            "--disable-infobars",
            "--exclude-switches=enable-automation",
            "--use-fake-ui-for-media-stream",
            "--disable-popup-blocking",
            "--disable-notifications"
        ],
        ignoreDefaultArgs: ["--enable-automation"] // Importante para remover a barra "Chrome is beign controlled..."
    });

    const context = await browser.newContext({
        viewport: null,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        locale: 'pt-BR',
        permissions: ['geolocation'],
        ignoreHTTPSErrors: true
    });

    // Injeção de Scripts para Mascarar Automação
    await context.addInitScript(() => {
        // Redefine webdriver como falso/undefined
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        
        // Simula Plugins (Chrome tem plugins padrão, Playwright não)
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        
        // Simula WebGL vendor (Muitos captchas checam isso)
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return 'Google Inc. (NVIDIA)';
            if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, or similar)';
            return getParameter(parameter);
        };
    });

    const page = await context.newPage();

    // Navega para Login
    await page.goto(PROJUDI_BASE, { waitUntil: 'domcontentloaded' });

    console.log("--> Tentando login automático...");
    
    try {
        // Credenciais Fixas
        const USER = "05296357558.rep";
        const PASS = "neocoelba@2023";

        // Busca inputs em todos os frames (pode estar dentro de iframe)
        let loginFrame = null;
        for (let i = 0; i < 10; i++) {
            for (const frame of page.frames()) {
                if (await frame.locator('input[name="login"]').count() > 0) {
                    loginFrame = frame;
                    break;
                }
            }
            if (loginFrame) break;
            await page.waitForTimeout(1000);
        }

        if (loginFrame) {
            console.log("Campos de login encontrados! Preenchendo...");
            await loginFrame.fill('input[name="login"]', USER);
            await page.waitForTimeout(500);
            await loginFrame.fill('input[name="senha"]', PASS);
            await page.waitForTimeout(500);
            
            console.log("Credenciais preenchidas. Pressione ENTER ou clique em ENTRAR se necessário.");
            // Tenta submeter
            await loginFrame.press('input[name="senha"]', 'Enter');
        } else {
            console.log("Campos de login não encontrados automaticamente. Faça manualmente.");
        }

    } catch (e) {
        console.error("Erro no preenchimento automático:", e.message);
    }
    
    console.log("--> Aguardando conclusão do login (Resolva o Captcha se aparecer)...");


    // Espera até que a URL *não* seja mais a de login ou 'projudi/' puro, OU que apareça algum elemento de dashboard
    try {
        console.log("Aguardando mudança de URL ou elemento de dashboard...");
        
        // Estratégia Dupla:
        // 1. Esperar URL mudar para algo que não seja logon
        // 2. Esperar aparecer o menu lateral ou topo (comum em sistemas logados)
        await Promise.race([
            page.waitForURL(url => !url.href.includes("Logon") && url.href.length > PROJUDI_BASE.length + 5, { timeout: 300000 }),
            page.waitForSelector('frame[name="mainFrame"]', { timeout: 300000 }), // Projudi usa frames
            page.waitForSelector('frame[name="topFrame"]', { timeout: 300000 })
        ]);

        console.log("Login Detectado! URL:", page.url());
        
        // --- DELAY POS-LOGIN: ESPERAR SESSÃO NO SERVIDOR + DASHBOARD ---
        console.log("Aguardando 5s para estabilização de sessão...");
        await page.waitForTimeout(5000);

    } catch (e) {
        console.error("Timeout ou erro na detecção de login.", e);
        await browser.close();
        process.exit(1);
    }

    // 2. CAPTURAR SESSÃO (Cookies) - Opcional, mantemos para log
    // console.log("2. Capturando Cookies de Sessão...");

    // --- STEP 2.5: Handle "CentroUsuarioRepresentante" Selection ---
    console.log('Main page loaded. Checking for "CentroUsuarioRepresentante" (Orgao Selection)...');

    try {
        // Wait a bit for frames to load
        await page.waitForTimeout(3000); 

        // Strategy: Drill down from mainFrame -> iframe
        let representantFrame = page.frames().find(f => f.url().includes('CentroUsuarioRepresentante'));
        
        if (!representantFrame) {
             console.log("Direct frame search failed. Dumping all frame URLs:");
             page.frames().forEach(f => console.log(` - ${f.url()}`));

             console.log("Attempting to find frame by name 'mainFrame' and getting its child...");
             const mainFrame = page.frames().find(f => f.name() === 'mainFrame');
             if (mainFrame) {
                 const childFrames = mainFrame.childFrames();
                 console.log(`mainFrame has ${childFrames.length} child frames.`);
                 if (childFrames.length > 0) {
                     representantFrame = childFrames[0];
                 }
             }
        }

        if (representantFrame) {
            console.log(`Found Frame URL: ${representantFrame.url()}`);
            console.log('Waiting for form content...');
            
            // Try to wait for Any content body
            await representantFrame.waitForLoadState('domcontentloaded');
            
            // Debug: dump content if form missing
            if (await representantFrame.locator('form[name="formulario"]').count() === 0) {
                 console.log("Form not found. Dumping frame content snippet:");
                 const content = await representantFrame.content();
                 console.log(content.substring(0, 500));
                 
                 // Maybe we need to go deeper?
                 // Check if there is an iframe inside THIS frame?
                 if (content.includes('<iframe')) {
                     console.log("Found nested iframe in HTML. Checking child frames...");
                     const childFrames = representantFrame.childFrames();
                     console.log(`Child frames count: ${childFrames.length}`);
                     if (childFrames.length > 0) {
                         representantFrame = childFrames[0];
                         console.log(`Switched to child frame: ${representantFrame.url()}`);
                     }
                 }
            }

            // In this frame, we look for the link...

            const orgaoLink = representantFrame.locator('a[href*="submitForm"]'); // looser selector
            const count = await orgaoLink.count();
            console.log(`Found ${count} orgao links.`);

            if (count > 0) {
                const linkText = await orgaoLink.first().textContent();
                console.log(`Found Orgao link: "${linkText.trim()}". Clicking...`);
                
                // Antes de clicar, vamos garantir que "TODAS AS COMARCAS" (-1) está selecionado se existir
                const comarcaSelect = representantFrame.locator('select[name="codComarca"]');
                if (await comarcaSelect.count() > 0) {
                     console.log("Selecionando 'TODAS AS COMARCAS' (-1)...");
                     await comarcaSelect.selectOption('-1');
                     await page.waitForTimeout(500);
                }

                // Click and wait for navigation
                await Promise.all([
                    page.waitForLoadState('networkidle'), // Wait for resultant navigation
                    orgaoLink.first().click(),
                ]);
                console.log('Orgao selected. Session should be fully active now.');
                await page.waitForTimeout(3000); // Stabilization
            } else {
                 console.log('No "submitForm" link found. Trying fallback JS execution...');
                 
                 // Selecionar Comarca via DOM antes de submeter
                 await representantFrame.evaluate(() => {
                    const select = document.querySelector('select[name="codComarca"]');
                    if(select) select.value = '-1';
                 });

                 await representantFrame.evaluate(() => {
                     // Tenta encontrar dinamicamente o ID do orgao no link se existir
                     const link = document.querySelector('a[href^="javascript: submitForm"]');
                     if (link) {
                         link.click();
                     } else {
                         // Se não achou link, tenta submeter o formulário direto se soubermos o ID
                         // O ID 153 pode estar errado. Vamos tentar pegar do HTML se possível ou chutar
                         console.log("Tentando forçar submitForm(153)...");
                         if (typeof submitForm === 'function') submitForm(153);
                     }
                 });
                 await page.waitForTimeout(5000);
            }
        } else {
            console.log('Frame "CentroUsuarioRepresentante" NOT found. Listing all frames:');
            page.frames().forEach(f => console.log(` - ${f.url()}`));
            console.log('Maybe already past selection screen? Proceeding...');
        }

    } catch (e) {
        console.error('Error during Orgao selection:', e);
    }


    // 3. EXTRAÇÃO HÍBRIDA V2: NAVEGAÇÃO RÁPIDA (DOMCONTENTLOADED)
    console.log("3. Navegando para Lista de Arquivados e Aplicando Filtro de 2018...");

    const ARQUIVADOS_URL = `${PROJUDI_BASE}/listagens/ProcessosParte?tipo=arquivados&isParteOrgaoRep=true`;

    try {
        await page.goto(ARQUIVADOS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        let contentFrame = page;
        const mainFrame = page.frames().find(f => f.name() === 'mainFrame');
        if (mainFrame) {
            console.log("Detectado frame 'mainFrame'.");
            contentFrame = mainFrame;
            await mainFrame.waitForLoadState('domcontentloaded');
        }

        // --- STEP 3.1: APPLY FILTER ---
        console.log("Aplicando filtro de data: 01/01/2018 a 31/12/2018...");
        await contentFrame.evaluate(() => {
             const f = document.querySelector('form#formEnvia');
             if (f) {
                 f.querySelector('input[name="dataInicio"]').value = '01/01/2018';
                 f.querySelector('input[name="dataFim"]').value = '31/12/2018';
                 f.querySelector('input[name="pagina"]').value = '1';
                 f.submit();
             }
        });
        
        console.log("Filtro submetido. Aguardando recarregamento...");
        await contentFrame.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(5000); // Wait for server rendering

        const html = await contentFrame.content();
        console.log(`Página carregada! Tamanho do HTML: ${(html.length / 1024).toFixed(2)} KB`);

        // 4. PARSEAMENTO COM CHEERIO
        console.log("4. Analisando HTML Filtrado com Cheerio...");
        const $ = cheerio.load(html);

        // DEBUG: Salvar HTML para análise manual
        fs.writeFileSync('debug_arquivados_2018.html', html);
        console.log("Salvi 'debug_arquivados_2018.html' para análise.");

        // Check result count
        const resultText = $('td').filter((i, el) => $(el).text().includes('resultados encontrados')).text().trim();
        console.log(`\n=== RESUMO DO FILTRO ===\n${resultText}`);
        
        // ... (rest of old logic for table parsing) ...


        // Tenta encontrar a tabela de processos
        const tables = $('table');
        console.log(`Encontradas ${tables.length} tabelas no HTML recuperado.`);

        let processCount = 0;
        
        // --- LOGICA DE PAGINAÇÃO ---
        console.log("--- Verificando Paginação ---");
        // Procura por links de paginação comuns no Projudi
        // Geralmente são links numéricos ou setas (<< < 1 2 3 > >>)
        // O Projudi costuma usar: <a href="?pagina=2"> ou submitForm com pagina
        const paginacaoLinks = $('a').filter((i, el) => {
             const txt = $(el).text().trim();
             // Filtra numeros isolados ou palavras chave
             return /^\d+$/.test(txt) || ['Próxima', 'Anterior', '>>', '<<', '>'].includes(txt);
        });

        console.log(`Encontrados ${paginacaoLinks.length} possíveis links de paginação.`);
        paginacaoLinks.each((i, el) => {
            console.log(`Link Paginação [${$(el).text().trim()}]: ${$(el).attr('href')}`);
        });

        // Teste de extração de processos
        $('tr').each((i, row) => {
            const text = $(row).text().trim();
            // Verifica se parece um processo (tem número CNJ ou antigo)
            if (/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(text)) {
                processCount++;
                // Imprime os primeiros 3 para confirmar
                if (processCount <= 3) {
                    console.log(`Processo Encontrado: ${text.replace(/\s+/g, ' ').substring(0, 100)}...`);
                }
            }
        });

        console.log(`\n=== RESULTADO ===`);
        console.log(`Total de Processos Pré-Identificados na Página 1: ${processCount}`);
        
        if (processCount > 0) {
            console.log("SUCESSO: A abordagem híbrida funcionou! Conseguimos ler a lista sem renderizar.");
        } else {
            console.log("ATENÇÃO: Não identificamos processos. O seletor do Cheerio pode precisar de ajuste ou a página veio vazia.");
            // Salva HTML para debug
            fs.writeFileSync('debug_arquivados.html', html);
            console.log("Salvi 'debug_arquivados.html' para análise.");
        }

    } catch (err) {
        console.error("Erro na extração híbrida:", err);
    } finally {
        console.log("\nFechando navegador...");
        await browser.close();
    }
}

runHybridExtraction().catch(console.error);
