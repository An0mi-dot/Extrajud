const { chromium } = require('playwright-core'); // Usando core pois Edge já deve estar instalado
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');

// Configurações
const PROJUDI_URL = "https://projudi.tjba.jus.br/projudi/";

// Estado global da automação (para permitir paradas)
let browser = null;
let context = null;
let page = null;
let isStopping = false;

// Utilitários de Log Inteligente
const log = (eventSender, msg, tech = null, type = 'info') => {
    // Para o console do terminal, imprime apenas a mensagem
    console.log(`[${type.toUpperCase()}] ${msg}`);
    
    // Para o Frontend, envia o objeto completo
    if (eventSender) {
        eventSender.send('log-message', {
            msg: msg,
            tech: tech || 'Function execution trace...',
            type: type
        });
    }
};

// Delay inteligente que permite interrupção (Check a cada 100ms)
const delay = async (ms) => {
    const steps = Math.ceil(ms / 100);
    for (let i = 0; i < steps; i++) {
        if (isStopping) throw new Error("STOP_REQUESTED"); // Lança erro para abortar pilha de execução
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};

// Função Principal
async function runAutomation(eventSender, inputReceiver, args) {
    isStopping = false;
    // Indica ao processo principal que uma automação está em execução
    global.isAutomationRunning = true;
    if (eventSender) eventSender.send('automation-status', true);

    // Heartbeat: only log once to avoid spamming when waiting for user action
    let _heartbeatLogged = false;
    let heartbeatInterval = setInterval(() => {
        if (global.isAutomationRunning && !_heartbeatLogged) {
            log(eventSender, 'Automação ativa: aguardando próximo passo...', 'heartbeat', 'info');
            _heartbeatLogged = true;
            try { clearInterval(heartbeatInterval); } catch(_) {}
        }
    }, 8000);

    // Bring main window to front once so the automation window (Edge) won't be hidden by other apps
    try {
        const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
        if (win) {
            log(eventSender, 'Trazendo a janela do app para frente (uma vez) para priorizar a automação', 'Window Focus', 'info');
            // Temporarily set always on top to ensure visibility, then restore
            win.setAlwaysOnTop(true, 'screen');
            // small delay to ensure stacking
            await delay(300);
            win.setAlwaysOnTop(false);
            try { win.focus(); } catch (e) { /* ignore */ }
        }
    } catch (e) {
        log(eventSender, `Não foi possível focar a janela: ${e && e.message ? e.message : String(e)}`, 'Window Focus', 'warn');
    }

    log(eventSender, "Iniciando Robô de Automação", "Thread Start | Loading Playwright Engine", 'info');
    log(eventSender, "Carregando configurações...", "Edge Browser | Mode: Scanner | Lib: ExcelJS", 'info');

    try {
        // 1. Configurar Navegador
        log(eventSender, "Inicializando Navegador Microsoft Edge...", "child_process.spawn(msedge.exe)", 'info');
        
        // Tenta achar o executável do Edge no Windows
        const edgePaths = [
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
        ];
        const edgeExe = edgePaths.find(p => fs.existsSync(p));
        
        if (!edgeExe) {
            throw new Error("Executável do Microsoft Edge não encontrado nos locais padrão.");
        }

        browser = await chromium.launch({
            executablePath: edgeExe,
            headless: false,
            args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
        });

        context = await browser.newContext({
            viewport: null, // Máximo
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
        });

        // Anti-detecção simples
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        page = await context.newPage();
        
        // Aumenta timeout de navegação padrão
        page.setDefaultTimeout(60000); 
        page.setDefaultNavigationTimeout(60000);

        // 2. Acesso e Login
        log(eventSender, "Acessando Portal PROJUDI...", `Navigation: ${PROJUDI_URL}`, 'info');
        
        try {
            await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (navError) {
             log(eventSender, "Erro inicial de conexão. Tentando reconexão...", `Error: ${navError.message}`, 'error');
             await delay(5000);
             try {
                 await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
             } catch (navError2) {
                 throw new Error(`Falha crítica ao acessar o site: ${navError2.message}. Verifique sua conexão VPN ou Internet.`);
             }
        }

        // --- LOGIN AUTOMÁTICO (Novidade) ---
        if (args && args.user && args.pass) {
            log(eventSender, "Tentando realizar login automático...", "Credentials injected via IPC args", 'info');
            try {
                // Aguarda carregamento inicial de frames
                await delay(2000);
                
        // --- LOGIN AUTOMÁTICO (Novidade - Versão Robusta) ---
        if (args && args.user && args.pass) {
            log(eventSender, "Detectadas credenciais. Iniciando varredura por campos de login...", "Searching frames for #login inputs", 'info');
            
            // Função auxiliar de busca em todos os frames (Main + Iframes)
            const findLoginInputs = async () => {
                const allFrames = [page, ...page.frames()]; // Inclui a página principal e frames
                for (const frame of allFrames) {
                    try {
                        // Tenta pelo ID exato (mais confiável segundo HTML fornecido)
                        const l = frame.locator('input#login');
                        const s = frame.locator('input#senha');
                        
                        if (await l.count() > 0 && await s.count() > 0) {
                            return { uInput: l, pInput: s, foundFrame: frame };
                        }
                    } catch (e) { /* Ignora frames inacessíveis (cross-origin) */ }
                }
                return null;
            };

            // Loop de Tentativas (Polling por 10 segundos)
            // Importante pois os frames podem demorar a carregar
            let inputs = null;
            for (let i = 0; i < 10; i++) {
                inputs = await findLoginInputs();
                if (inputs) break;
                
                if (i === 0) log(eventSender, `Aguardando renderização dos campos de login... (${page.frames().length} frames detectados)`);
                await delay(1000);
            }

            if (inputs) {
                const { uInput, pInput } = inputs;
                log(eventSender, "Campos 'login' e 'senha' ENCONTRADOS!");
                try {
                    await uInput.fill(args.user);
                    
                    // Pequeno delay entre preenchimentos (humano)
                    await delay(300); 
                    
                    await pInput.fill(args.pass);
                    log(eventSender, "Credenciais preenchidas. Submetendo...");
                    
                    await pInput.press('Enter');
                } catch (fillErr) {
                    log(eventSender, `Erro ao interagir com inputs: ${fillErr.message}`);
                }
            } else {
                log(eventSender, "ALERTA: Timeout de 10s esgotado. Campos de login não apareceram na árvore DOM.");
                log(eventSender, "Sugestão: Verifique se o site carregou corretamente ou exibe algum popup.");
            }
        }



            } catch (err) {
                log(eventSender, `Erro no preenchimento automático: ${err.message}`);
            }
        }

        log(eventSender, "AGUARDANDO FINALIZAÇÃO DO LOGIN (Captcha/Manual)...");
        log(eventSender, "-> O sistema vai procurar o botão 'REPRESENTAÇÃO COELBA' automaticamente.");

        // Loop de espera do Login / Seleção de Perfil
        let logged = false;
        while (!logged && !isStopping) {
            const frames = page.frames();

            // 1. Tenta clicar Representação (Varre todos os frames)
            for (const frame of frames) {
                try {
                    // Regex flexível para: REPRESENTAÇÃO COELBA / REPRESENTACAO COELBA (Case insensitive)
                    // O ponto (.) serve como coringa para 'Ç' ou 'C'
                    const btn = frame.locator("a").filter({ hasText: /REPRESENTA.ÃO\s+COELBA/i }).first();
                    
                    if (await btn.count() > 0 && await btn.isVisible()) {
                        log(eventSender, ">>> Botão 'REPRESENTAÇÃO COELBA' detectado. Clicando...");
                        await btn.click();
                        log(eventSender, "Aguardando 15 segundos para carregamento do painel...");
                        await delay(15000); 
                        logged = true;
                        break;
                    }
                } catch (e) {}
            }
            if (logged) break;

            // 2. Verifica se já está no dashboard (Varre todos os frames)
            for (const frame of frames) {
                try {
                    // Dashboard geralmente tem "Mesa de Trabalho" ou "Aguardando Leitura"
                    // Verifica visibilidade para garantir
                    const hasMesa = await frame.locator("text=Mesa de Trabalho").count() > 0;
                    const hasLeitura = await frame.locator("text=Aguardando Leitura").count() > 0;
                    
                    if (hasMesa || hasLeitura) {
                        log(eventSender, ">>> Dashboard detectado.");
                        logged = true;
                        break;
                    }
                } catch (e) {}
            }
            if (logged) break;
            
            await delay(1000);
        }
        if (isStopping) return;

        // --- FASE 1: CITAÇÕES ---
        const dfCita = await processCategoryRoutine(page, "Citações", 'cita', eventSender, inputReceiver, args);
        if (isStopping) return;
        
        // Voltar Home
        log(eventSender, "Retornando ao Dashboard...", "Navigation: Home", 'info');
        await returnToDashboard(page, eventSender);
        if (isStopping) return;

        // --- FASE 2: INTIMAÇÕES ---
        const dfInti = await processCategoryRoutine(page, "Intimações", 'inti', eventSender, inputReceiver, args);
        if (isStopping) return;

        // --- SALVAR EXCEL ---
        await saveToExcel(dfCita, dfInti, eventSender, args);

        log(eventSender, "Automação finalizada com sucesso!", "Process complete. Saving artifacts...", 'success');
        eventSender.send('script-finished', 0);

    } catch (error) {
        if (error.message === "STOP_REQUESTED" || isStopping) {
             log(eventSender, "Automação interrompida pelo usuário.", "STOP_SIGNAL received", 'error');
        } else {
             log(eventSender, `ERRO CRÍTICO: ${error.message}`, error.stack, 'error');
             eventSender.send('script-finished', 1);
        }
    } finally {
        // Encerra browser sempre, conforme solicitado
        if (browser) {
             log(eventSender, "Fechando navegador e limpando memória...", "Browser instance teardown", 'info');
             try { await browser.close(); } catch(e){}
             browser = null;
        }
        // Indica que a automação terminou
        global.isAutomationRunning = false;
        if (typeof heartbeatInterval !== 'undefined') {
            try { clearInterval(heartbeatInterval); } catch(_){}
        }
        if (eventSender) eventSender.send('automation-status', false);
    }
}

async function stopAutomation(eventSender) {
    isStopping = true;
    log(eventSender, "!!! Solicitada parada da automação !!!");
    if (eventSender) eventSender.send('automation-status', 'stopping');
    // Removido o fechamento imediato do browser aqui
    // Deixa o fluxo principal (runAutomation) cuidar de fechar/salvar
}

// --- FUNÇÕES AUXILIARES ---

async function returnToDashboard(page, eventSender) {
    log(eventSender, "Retornando ao Dashboard (Navegação Direta)...");
    try {
        // [MODIFICAÇÃO SOLICITADA] - Substituída a busca manual do botão Home por navegação direta
        // URL extraída do log do usuário: https://projudi.tjba.jus.br/projudi/usuarioRepresentante/CentroUsuarioRepresentante
        
        const dashboardUrl = "https://projudi.tjba.jus.br/projudi/usuarioRepresentante/CentroUsuarioRepresentante";
        const frames = page.frames();
        
        // Tenta encontrar o frame central ('userMainFrame')
        let mainFrame = frames.find(f => f.name() === 'userMainFrame');
        
        if (mainFrame) {
            log(eventSender, `Navegando frame 'userMainFrame' para: ${dashboardUrl}`);
            await mainFrame.goto(dashboardUrl);
        } else {
            // Fallback: Procura qualquer frame que pareça ser o principal (que não seja o menu lateral)
            log(eventSender, "Frame 'userMainFrame' não achado. Tentando maior frame disponível.");
            
            // Geralmente o maior frame é o de conteúdo
            const biggestFrame = frames.sort((a,b) => {
                const sA = a.viewportSize() ? a.viewportSize().width * a.viewportSize().height : 0;
                const sB = b.viewportSize() ? b.viewportSize().width * b.viewportSize().height : 0;
                return sB - sA;
            })[0];

            if (biggestFrame) {
                await biggestFrame.goto(dashboardUrl);
            } else {
                 // Último recurso: Navegar página (Cuidado com logout)
                 log(eventSender, "Aviso: Navegando página principal (pode causar refresh total).");
                 await page.goto(dashboardUrl);
            }
        }
        
        log(eventSender, "Aguardando 5s para carregamento do painel...");
        await delay(5000);

    } catch (e) {
        log(eventSender, `Erro ao voltar via URL: ${e.message}`);
    }
}

async function processCategoryRoutine(page, categoryName, mode, eventSender, inputReceiver, args) {
    log(eventSender, `\n--- PROCESSANDO: ${categoryName} ---`);
    
    // 1. Navegar para o Item (Citações ou Intimações) -> Aguardando Leitura
    // Lógica: Citações é o primeiro card "Aguardando Leitura", Intimações é o segundo.
    
    let targetClicked = false;
    const frames = page.frames();
    
    let selector = "text=Aguardando Leitura";
    if (mode === 'inti') {
        selector = 'a[href*="listagens/Intimacoes?tipo=novas"]'; 
    } else if (mode === 'cita') {
        // Usa HREF para evitar ambiguidades com Notificações
        selector = 'a[href*="listagens/Citacoes?tipo=novas"]';
    }
    
    // Procura em frame principal ou todos
    for (const frame of frames) {
        try {
            // Nota: Para Citações, o seletor genérico href*="listagens/Citacoes?tipo=novas" pega tanto Citações quanto Notificações (se o parâmetro for parcial)
            // Mas "Citacoes?tipo=novas" extato exclui "ehNotificacao=true" se usarmos string exata ou regex cuidadosa.
            // O Playwright selector 'a[href*="..."]' é contain.
            // O HTML de Notificações é: listagens/Citacoes?tipo=novas&ehNotificacao=true
            // O de Citações é: listagens/Citacoes?tipo=novas
            // Se eu pegar o primeiro que contém "tipo=novas" e NÃO contém "ehNotificacao", é o correto.
            
            const btns = await frame.locator(selector).all();
            
            for(const btn of btns) {
                 if (await btn.isVisible()) {
                     const href = await btn.getAttribute('href');
                     // Filtro extra para Citações vs Notificações
                     if (mode === 'cita' && href && href.includes('ehNotificacao=true')) continue;
                     
                     await btn.click();
                     targetClicked = true;
                     log(eventSender, `Clicado em Aguardando Leitura (${categoryName}).`);
                     break;
                 }
            }
            if (targetClicked) break;
        } catch (e) {}
    }

    if (!targetClicked) {
        log(eventSender, `[ATENÇÃO] Não achei o botão de ${categoryName} pelo clique.`);
        log(eventSender, `Tentando navegação direta por URL...`);
        
        // Tentativa de navegação direta via URL no frame principal
        try {
            const targetUrl = mode === 'inti' 
                ? "https://projudi.tjba.jus.br/projudi/listagens/Intimacoes?tipo=novas"
                : "https://projudi.tjba.jus.br/projudi/listagens/Citacoes?tipo=novas";
                
            // Tenta encontrar o frame central (userMainFrame)
            let mainFrame = page.frames().find(f => f.name() === 'userMainFrame');
            if (mainFrame) {
                await mainFrame.goto(targetUrl);
                log(eventSender, `Navegação forçada para: ${targetUrl}`);
                targetClicked = true;
            } else {
                 // Fallback: Tenta achar frame maior ou vai na page toda
                 // Mas page.goto pode dar logout se for top level. 
                 // Vamos tentar achar qualquer frame grande.
                 const biggestFrame = page.frames().sort((a,b) => (b.page() ? 1 : 0) - (a.page() ? 1 : 0))[0]; // simplificado
                 if(biggestFrame) await biggestFrame.goto(targetUrl);
            }
        } catch(e) {
            log(eventSender, `Falha na navegação direta: ${e.message}`);
        }
    }

    if (!targetClicked) {
        log(eventSender, `[FALHA] Não foi possível acessar ${categoryName}. Abortando esta etapa.`);
        return [];
    }

    await delay(5000); // Wait for load

    // 2. Filtro (Automático ou Manual)
    // Suporte a range de datas (dateStart e dateEnd) ou fallback legacy (filterDate)
    const dStart = args.dateStart || args.filterDate;
    const dEnd = args.dateEnd || args.filterDate;

    if (dStart && dEnd) {
        // Formata YYYY-MM-DD (do input HTML5) para DD/MM/YYYY (do Projudi)
        const fmt = (isoDate) => {
            const parts = isoDate.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        };
        
        const fmtStart = fmt(dStart);
        const fmtEnd = fmt(dEnd);

        log(eventSender, `\nFILTRO AUTOMÁTICO ATIVO: De ${fmtStart} até ${fmtEnd}`);
        log(eventSender, "Buscando campos de filtro...");

        let filterFrame = null;
        // Tenta localizar o frame do filtro por alguns segundos
        for (let i = 0; i < 20; i++) { // 20 segs max
            if (isStopping) break;
            for (const frame of page.frames()) {
                // Verifica se frame tem os inputs E se a URL corresponde ao modo esperado
                if (await frame.locator('#horarioInicio').count() > 0) {
                    const fUrl = frame.url();
                    // Validação Cruzada de URL
                    if (mode === 'inti' && !fUrl.includes('Intimacoes')) continue;
                    if (mode === 'cita' && !fUrl.includes('Citacoes')) continue;
                    
                    filterFrame = frame;
                    break;
                }
            }
            if (filterFrame) break;
            await delay(1000);
        }

        if (filterFrame) {
            try {
                log(eventSender, `Campos encontrados no frame: ${filterFrame.url()}`);
                log(eventSender, "Preenchendo datas...");
                await filterFrame.locator('#horarioInicio').fill(fmtStart);
                await filterFrame.locator('#horarioFim').fill(fmtEnd);
                
                log(eventSender, "Enviando comando de pesquisa...");
                
                // Detecta navegação do frame automagicamente
                // Captura a promessa ANTES do Enter para não perder o evento
                const navigationPromise = filterFrame.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 })
                    .catch(() => log(eventSender, "Nota: Navegação não detectada ou página carregou instantaneamente (AJAX)."));

                await filterFrame.locator('#horarioFim').press('Enter');
                
                log(eventSender, "Aguardando resposta do servidor (carregamento)...");
                await navigationPromise;

            } catch (e) {
                log(eventSender, `[ERRO] Falha ao aplicar filtro: ${e.message}`);
            }
        } else {
            log(eventSender, "[ALERTA] Campos de filtro não localizados. A automação tentará extrair o que estiver na tela.");
        }

    } else {
        // Fallback para modo manual (sem data selecionada)
        const yesterday = dayjs().subtract(1, 'day').format('DD/MM/YYYY');
        log(eventSender, `\nFILTRO NECESSÁRIO! Data Sugerida: ${yesterday}`);
        log(eventSender, "1. Preencha a Data.");
        log(eventSender, "2. Clique em Pesquisar.");
        log(eventSender, "3. CLIQUE NO BOTÃO 'CONFIRMAR (ENTER)' NO APP QUANDO A TABELA APARECER.");
        
        // Esperar input do usuário via IPC
        await waitForUserConfirm(inputReceiver);
    }

    // 3. Extração Pagina
    let allRecords = [];
    let pageScreenshots = []; // Buffer de imagens
    let pageNum = 1;

    while (true && !isStopping) {
        log(eventSender, `Extraindo Página ${pageNum}...`);
        
        // 1. Encontrar o frame correto (que contenha a tabela de dados)
        let contentFrame = null;
        for (const frame of page.frames()) {
            try {
                // Procura cabeçalho específico (Ajustado para 'Nº do processo')
                const locator = frame.locator("th").filter({ hasText: /N. do processo/i });
                if (await locator.count() > 0) {
                    contentFrame = frame;
                    log(eventSender, `Frame de dados localizado: ${frame.url()}`);
                    break;
                }
            } catch (e) {}
        }

        if (!contentFrame) {
             log(eventSender, "AVISO: Frame de tabela não encontrado via seletor 'th'. Tentando procurar por linhas 'tCinza'...");
             // Fallback 2: Procura onde existem linhas de tabela
             for (const frame of page.frames()) {
                 try {
                     if (await frame.locator('tr.tCinza').count() > 0) {
                         contentFrame = frame;
                         log(eventSender, `Frame localizado por tr.tCinza: ${frame.url()}`);
                         break;
                     }
                 } catch(e){}
             }
        }
        
        if (!contentFrame) {
             log(eventSender, "ALERTA: Não foi possível determinar o frame da tabela. Usando frame padrão.");
             contentFrame = page; 
        }
        
        // Wait for table (com retry curto)
        try {
            await contentFrame.waitForSelector('tr.tCinza, tr.tBranca', { timeout: 4000 });
        } catch (e) {}

        // Retry logic para tabela vazia
        let records = [];
        for (let attempt = 0; attempt < 4; attempt++) {
            const html = await contentFrame.content();
            records = extractTableCustom(html, mode);
            if (records.length > 0) break;
            if (attempt < 3) {
                log(eventSender, `(Tentativa ${attempt+1}) Nenhum processo achado. Pode ser carregamento ou fim.`);
                await delay(3000);
            }
        }

        if (records.length > 0) {
            allRecords.push(...records);
            log(eventSender, `Capturados ${records.length} processos.`);
        } else {
            log(eventSender, `Nenhum processo capturado na página ${pageNum}.`);
        }

        // --- CAPTURA DE EVIDÊNCIA (SCREENSHOT) ---
        if (contentFrame) {
            try {
                // --- TABELA DE RESULTADOS (SOLUÇÃO REFINADA v5 - Citações FullPage) ---
                // Problema anterior: Table direta estava cortando a última linha/borda em Citações.
                
                let buff;

                // [CORREÇÃO SOLICITADA] - Modo Citações vs Intimações
                // O usuário relatou que Citações estava cortando. Vamos usar fullPage para garantir.
                if (mode === 'cita') {
                     log(eventSender, `[EVIDÊNCIA] Modo Citações: Usando captura FULL PAGE do frame para evitar cortes.`);
                     
                     // --- LÓGICA DE CAPTURA INTELIGENTE (REDIMENSIONAMENTO DE VIEWPORT) ---
                     // Resolve o problema de cortes em listas longas onde o screenshot padrão falha.
                     
                     // 1. Calcular altura real do conteúdo dentro do frame
                     const fullHeight = await contentFrame.evaluate(() => {
                        const body = document.body;
                        const html = document.documentElement;
                        // Pega a maior altura possível (conteúdo total)
                        return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                     });

                     // 2. Redimensionar a janela do navegador temporariamente se necessário
                     // Isso força o navegador a renderizar todo o conteúdo de uma vez, evitando rolagem interna
                     let originalSize = page.viewportSize();
                     if (!originalSize) {
                         // Se viewport for null (start-maximized), pegamos via JS
                         try {
                             originalSize = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
                         } catch (eDim) {
                             originalSize = { width: 1366, height: 768 }; // Fallback seguro
                         }
                     }

                     const needsResize = originalSize && fullHeight > originalSize.height;

                     if (needsResize) {
                         // Define altura com folga extra (Aumentado para 450px para garantir rodapés e bordas finais)
                         await page.setViewportSize({ width: originalSize.width, height: fullHeight + 450 });
                         await delay(500); // Aguarda browser repintar a tela
                     }

                     try {
                        // 3. Captura Específica INTELIGENTE
                        // Evita o 'div#Arquivos' se ele contiver o cabeçalho do site.
                        // Prioriza a tabela de processos (#processos ou .subTituloTabela)
                        
                        let targetEl = contentFrame.locator('table#processos');
                        if (await targetEl.count() === 0) {
                             targetEl = contentFrame.locator('table').filter({ has: contentFrame.locator('tr.subTituloTabela') }).first();
                        }

                        let elementToScreenshot = null;

                        if (await targetEl.count() > 0 && await targetEl.isVisible()) {
                            // Verifica se o pai é um wrapper justo ou se é um container geral (body/Arquivos)
                            const parent = targetEl.locator('xpath=..');
                            const parentId = await parent.getAttribute('id').catch(() => '');
                            const parentTag = await parent.evaluate(el => el.tagName.toLowerCase()).catch(() => 'body');
                            
                            // Lista de containers "perigosos" que podem incluir o header do site
                            const unsafeContainers = ['body', 'html', 'Arquivos', 'arquivos', 'divMain', 'containerGeral'];
                            
                            if (unsafeContainers.includes(parentTag) || unsafeContainers.includes(parentId)) {
                                log(eventSender, "Alvo detectado é a Tabela (Container pai é muito genérico).");
                                elementToScreenshot = targetEl;
                            } else {
                                log(eventSender, `Alvo detectado é o Container da tabela (<${parentTag} id="${parentId}">).`);
                                elementToScreenshot = parent;
                            }
                        } else {
                             // Fallback: Tenta div#Arquivos mas saiba que pode ter header
                             log(eventSender, "Tabela não identificada. Usando fallback div#Arquivos.");
                             elementToScreenshot = contentFrame.locator('div#Arquivos');
                             if (await elementToScreenshot.count() === 0) {
                                 elementToScreenshot = contentFrame.locator('html');
                             }
                        }
                        
                        if (elementToScreenshot) {
                            // Garante renderização (Scroll)
                            await contentFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                            await delay(500);
                            
                            // Scroll do elemento (opcional, mas ajuda)
                            try { await elementToScreenshot.scrollIntoViewIfNeeded(); } catch(e){}

                            buff = await elementToScreenshot.screenshot({ type: 'jpeg', quality: 90 });
                        }

                     } catch(eCapture) {
                         log(eventSender, `[AVISO] Erro na captura expandida: ${eCapture.message}. Tentando fallback simples.`);
                         buff = await contentFrame.locator('body').screenshot({ type: 'jpeg', quality: 85 });
                     } finally {
                         // 4. Restaura tamanho original da janela (Importante para não quebrar navegação futura)
                         if (needsResize) {
                            await page.setViewportSize(originalSize);
                         }
                     }

                } else {
                    // [MODO INTIMAÇÕES] - Atualizado para usar estratégia de Viewport Expandido (igual Citações)
                    // Objetivo: Capturar Tabela + Paginação (Rodapé) sem cortes.
                    
                    log(eventSender, `[EVIDÊNCIA] Modo Intimações: Aplicando captura inteligente para incluir paginação.`);

                    // 1. Calcular altura real e expandir Viewport
                    const fullHeight = await contentFrame.evaluate(() => {
                        const body = document.body;
                        const html = document.documentElement;
                        return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
                     });

                     let originalSize = page.viewportSize();
                     if (!originalSize) {
                         try { originalSize = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })); } catch (e) { originalSize = { width: 1366, height: 768 }; }
                     }

                     const needsResize = originalSize && fullHeight > originalSize.height;

                     if (needsResize) {
                         await page.setViewportSize({ width: originalSize.width, height: fullHeight + 400 }); // +400px de folga
                         await delay(500); 
                     }

                     try {
                        // 2. Foco na captura: Tenta achar um container que englobe a tabela E a paginação
                        // Geralmente a paginação é irmã da tabela ou está logo abaixo.
                        
                        // Primeiro, acha a tabela principal
                        let mainTable = contentFrame.locator('table').filter({ has: contentFrame.locator('tr.subTituloTabela') }).first();
                        
                        let elementToScreenshot = null;

                        if (await mainTable.count() > 0) {
                             const parent = mainTable.locator('xpath=..');
                             const parentTag = await parent.evaluate(el => el.tagName.toLowerCase()).catch(()=>'body');
                             
                             // Se o pai for um FORM ou DIV específico, é provável que contenha a paginação
                             // Se for BODY, capturamos a tabela e torcemos (ou tentaremos o body todo mais tarde)
                             if (parentTag !== 'body' && parentTag !== 'html') {
                                 // Tenta subir mais um nível se o pai for muito "justo"
                                 // A paginação costuma ficar fora da tabela
                                 const grandParent = parent.locator('xpath=..');
                                 const grandParentTag = await grandParent.evaluate(el => el.tagName.toLowerCase()).catch(()=>'body');
                                 
                                 if (grandParentTag !== 'body' && grandParentTag !== 'html' && (await grandParent.getAttribute('id')) !== 'Arquivos') {
                                    elementToScreenshot = grandParent;
                                 } else {
                                    elementToScreenshot = parent;
                                 }
                             } else {
                                elementToScreenshot = mainTable;
                             }
                        }

                        // Garante renderização do final da página
                        await contentFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                        await delay(500);

                        if (elementToScreenshot && await elementToScreenshot.count() > 0) {
                             try { await elementToScreenshot.scrollIntoViewIfNeeded(); } catch(e){}
                             buff = await elementToScreenshot.screenshot({ type: 'jpeg', quality: 90 });
                        } else {
                             // Fallback: Captura o HTML filtrado (ou body) se não achar container perfeito
                             // Para intimações, muitas vezes é melhor pegar o body todo do frame se ele for limpo
                             log(eventSender, "Container específico não ideal. Capturando BODY do frame de dados.");
                             buff = await contentFrame.locator('body').screenshot({ type: 'jpeg', quality: 85 });
                        }

                     } catch(eCapture) {
                         log(eventSender, `[AVISO] Erro na captura Intimações: ${eCapture.message}. Fallback simples.`);
                         buff = await contentFrame.screenshot({ type: 'jpeg', quality: 80, fullPage: true }); 
                     } finally {
                         if (needsResize) await page.setViewportSize(originalSize);
                     }
                }
                
                pageScreenshots.push(buff);
                log(eventSender, `[EVIDÊNCIA] Print da página ${pageNum} capturado.`);
            } catch (errScreen) {
                log(eventSender, `[AVISO] Falha ao tirar print: ${errScreen.message}`);
                // Tentativa de emergência: Viewport
                try {
                    const buff = await contentFrame.screenshot({ type: 'jpeg', quality: 80, fullPage:true });
                    pageScreenshots.push(buff);
                } catch(e) {}
            }
        }

        // Paginação
        const nextBtn = contentFrame.locator("a[title='próxima página'], a[alt='próxima'], img[src*='seta_direita.gif']").first();
        const nextBtnParent = contentFrame.locator("a:has(img[src*='seta_direita.gif'])").first();
        
        let hasNext = false;
        let clickTarget = null;
        
        // Verifica primeiro o pai (link com imagem)
        if (await nextBtnParent.count() > 0 && await nextBtnParent.isVisible()) {
             clickTarget = nextBtnParent;
             hasNext = true;
        } else if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
             clickTarget = nextBtn;
             hasNext = true;
        }

        if (hasNext && clickTarget) {
            log(eventSender, "Avançando próxima página...");
            
            // --- LÓGICA DE REFILTRO (INTIMAÇÕES) ---
            if (mode === 'inti' && (args.dateStart || args.filterDate)) {
                 try {
                     const fInicio = contentFrame.locator('#horarioInicio');
                     const fFim = contentFrame.locator('#horarioFim');
                     
                     if (await fInicio.count() > 0) {
                         const val = await fInicio.inputValue();
                         // Se dataStart/End, usa fmt(dStart), se legacy parts...
                         // Melhor simplificar reutilizando a função de formatação
                         
                         let rawStart = args.dateStart || args.filterDate;
                         let partsS = rawStart.split('-');
                         let fmtS = `${partsS[2]}/${partsS[1]}/${partsS[0]}`;
                         
                         let rawEnd = args.dateEnd || args.filterDate;
                         let partsE = rawEnd.split('-');
                         let fmtE = `${partsE[2]}/${partsE[1]}/${partsE[0]}`;

                         if (val !== fmtS) { // Se o inicio perdeu o valor ou mudou
                             log(eventSender, `Reaplicando filtro para página ${pageNum + 1}...`);
                             await fInicio.fill(fmtS);
                             await fFim.fill(fmtE);
                         }
                     }
                 } catch (e) {
                     log(eventSender, `Aviso: Falha ao reaplicar filtro (pg ${pageNum}): ${e.message}`);
                 }
            }
            
            try {
                const navPromise = contentFrame.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
                await clickTarget.click();
                await navPromise;
                pageNum++;
                await delay(1000);
            } catch (e) {
                log(eventSender, "Erro/Fim da paginação ao clicar.");
                break;
            }
        } else {
            log(eventSender, "Fim da paginação.");
            break;
        }
    }

    // --- GERAR PDF DE EVIDÊNCIAS ---
    if (pageScreenshots.length > 0) {
        await saveEvidencePDF(pageScreenshots, categoryName, args, eventSender);
    }

    return allRecords;
}

function extractTableCustom(html, mode) {
    const $ = cheerio.load(html);
    const records = [];
    
    // 1. Descobrir índices das colunas dinamicamente com base no cabeçalho
    // Isso evita erros se a ordem das colunas mudar
    const headers = [];
    $('tr.subTituloTabela th').each((i, el) => {
        headers.push($(el).text().trim().toUpperCase());
    });


    // Mapeamento PADRÃO (Fallback caso não ache cabeçalho)
    let idxPost = mode === 'cita' ? 4 : 3; // Intimações: Postagem é col 3 (0-based) na tabela, mas vamos confiar no header scan
    let idxCiencia = mode === 'cita' ? 7 : -1;
    let idxEntrada = mode === 'cita' ? 8 : -1;
    let idxIntimacao = mode === 'inti' ? 6 : -1;

    // Tenta achar pelos nomes
    headers.forEach((h, i) => {
        if (h.includes("POSTAGEM")) idxPost = i;
        if (h.includes("CIÊNCIA") || h.includes("CIENCIA")) idxCiencia = i;
        if (mode === 'cita' && (h.includes("ENTRADA") || h.includes("RECEBIMENTO") || h.includes("MOVIMENTACAO"))) {
             if (h.includes("ENTRADA")) idxEntrada = i;
        }
        if (mode === 'inti' && (h.includes("INTIMAÇÃO") || h.includes("INTIMACAO"))) idxIntimacao = i;
    });
    
    // Fallback manual forçado para Intimações (baseado no HTML fornecido)
    if (mode === 'inti' && idxIntimacao === -1) idxIntimacao = 6;
    if (mode === 'inti' && idxPost === -1) idxPost = 3;

    log(null, `[DEBUG] Indices identificados - Post: ${idxPost}, Ciencia: ${idxCiencia}, Entrada: ${idxEntrada}, Intimacao: ${idxIntimacao}`);

    let dataRows;

    // --- SELETOR DE LINHAS ---
    if (mode === 'cita') {
        // [MODO CITAÇÕES] - Comportamento Original (Revertido)
        // Busca linhas com as classes padrão do Projudi
        dataRows = $('tr.tCinza, tr.tBranca');
        
        // Se falhar, tenta fallback genérico (linhas com classe 'destaque' ou similar, ou apenas TRs da tabela principal)
        if (dataRows.length === 0) {
            dataRows = $('table#processos tr').not(':first-child'); 
            // Se ainda assim 0, tenta o genérico
            if (dataRows.length === 0) dataRows = $('tr').filter((i, el) => $(el).children('td').length > 7);
        }
    } else {
        // [MODO INTIMAÇÕES] - Comportamento Específico (Novo)
        // O HTML fornecido mostrava uma structure nested dentro de um form
        dataRows = $('form[name="formIntimacoes"] table tr').not('.primeiraLinha, .subTituloTabela');
        
        // Fallback para classes se o form não for achado
        if (dataRows.length === 0) {
            dataRows = $('tr:has(td.tCinza), tr:has(td.tBranca)'); // Tenta achar pela cor dentro da TD
        }
    }
    
    log(null, `[DEBUG - ${mode.toUpperCase()}] Linhas candidatas encontradas: ${dataRows.length}`);

    dataRows.each((i, row) => {
        const el = $(row);
        let cols = el.children('td'); 
        
        // Pula linhas que são apenas container de detalhe ou vazias
        if (cols.length < 5) return;

        // Extraão Robusta de Texto (limpa espaços, quebras de linha e HTML aninhado)
        // O jQuery/Cheerio .text() pega o texto de todos os descendentes (font, strong, etc)
        const text = el.text().replace(/\s+/g, ' ').trim();
        
        // Regex para NPU (formato XXXXXXX-XX.XXXX.X.XX.XXXX)
        const procMatch = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
        
        // DEBUG ESPÉCIFICO PARA PRIMEIRA LINHA
        if (i === 0) {
             const preview = text.substring(0, 70);
             log(null, `[DEBUG ROW 0 - ${mode.toUpperCase()}] Text: "${preview}..." | Match: ${procMatch ? 'SIM' : 'NÃO'} | Cols: ${cols.length}`);
             if (!procMatch) {
                 const linkD = el.find('a[href*="DadosProcesso"]').text().trim();
                 log(null, `[DEBUG ROW 0] Tentativa Link: "${linkD}"`);
             }
        }
        
        let npu = "";
        if (procMatch) {
            npu = procMatch[0];
        } else {
            // Tenta pegar de dentro do link se houver (caso o texto da linha falhe)
            const linkText = el.find('a[href*="DadosProcesso"]').text().trim();
            const matchCol1 = linkText.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
            if (matchCol1) npu = matchCol1[0];
        }

        if (npu) {
            // Função local para extrair e normalizar data da célula
            const getColDate = (idx) => {
                if (idx < 0 || idx >= cols.length) return "";
                
                // PEGA O TEXTO PURO, IGNORANDO TAGS COMO <font>, <strong>
                let val = $(cols[idx]).text().trim().replace(/\s+/g, ' ');

                // Normaliza datas texto extenso: "21 de Janeiro de 2026"
                const meses = {
                    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04', 'maio': '05', 'junho': '06',
                    'julho': '07', 'agosto': '08', 'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
                };
                
                const mExtenso = val.match(/(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)\s+de\s+(\d{4})/i);
                if (mExtenso) {
                    const dia = mExtenso[1].padStart(2, '0');
                    const mesNome = mExtenso[2].toLowerCase();
                    const ano = mExtenso[3];
                    const mes = meses[mesNome];
                    if (mes) return `${dia}/${mes}/${ano}`;
                }

                // Normaliza 2 digitos (ex: 24 -> 2024)
                const m = val.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
                if (m) {
                    let y = m[3];
                    if (y.length === 2) y = "20" + y;
                    return `${m[1]}/${m[2]}/${y}`;
                }
                return val; // Retorna valor original se não bater regex (ex: "-")
            };

            let dtPost = getColDate(idxPost);
            let dtCiencia = getColDate(idxCiencia); // Citações
            let dtEntrada = getColDate(idxEntrada); // Citações
            let dtIntimacao = getColDate(idxIntimacao); // Intimações
            
            // Log de depuração para entender o que está sendo lido
            if (mode === 'inti') {
                log(null, `[DEBUG] Processo ${npu} | Intimação Raw: "${$(cols[idxIntimacao]).text().trim()}" -> Parsed: ${dtIntimacao}`);
            }

            records.push({
                npu: npu,
                dtPost: dtPost,
                dtCiencia: dtCiencia,
                dtEntrada: dtEntrada,
                dtIntimacao: dtIntimacao // Novo campo
            });
        }
    });

    // Filtro de Duplicados
    const uniqueRecords = [];
    const seen = new Set();
    records.forEach(r => {
        if (r.npu && !seen.has(r.npu)) {
            seen.add(r.npu);
            uniqueRecords.push(r);
        }
    });

    return uniqueRecords;
}

function waitForUserConfirm(inputReceiver) {
    return new Promise(resolve => {
        // Listener único
        const handler = () => {
            inputReceiver.removeListener('user-confirm-input', handler);
            resolve();
        };
        inputReceiver.on('user-confirm-input', handler);
    });
}

function calculateD3() {
    let target = dayjs().add(3, 'day');
    // 0=Sun, 6=Sat
    if (target.day() === 6) target = target.add(2, 'day'); // Sábado -> Segunda
    if (target.day() === 0) target = target.add(1, 'day'); // Domingo -> Segunda
    return target.format('DD/MM/YYYY');
}

async function saveToExcel(recordsCita, recordsInti, eventSender, args) {
    if ((!recordsCita || recordsCita.length === 0) && (!recordsInti || recordsInti.length === 0)) {
        log(eventSender, "Nenhum dado para salvar.");
        return;
    }

    // Configurações de Data
    const todayStr = dayjs().format('DD/MM/YYYY');
    let filenameDate;

    if (args && (args.dateEnd || args.filterDate)) {
        // Se temos filtro, o nome do arquivo assume a data do filtro
        // Preferência para a data final (que engloba o período processado)
        let refDate = args.dateEnd || args.filterDate;
        const parts = refDate.split('-');
        filenameDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
        
        // Se for um range (diferentes datas), podemos indicar isso, mas para manter compatibilidade:
        // Se quiser Explicito: [01.01.2026 A 04.01.2026]
        if (args.dateStart && args.dateEnd && args.dateStart !== args.dateEnd) {
             const pStart = args.dateStart.split('-');
             const fStart = `${pStart[2]}.${pStart[1]}.${pStart[0]}`;
             filenameDate = `${fStart} A ${filenameDate}`;
        }
        
    } else {
        // Fallback para dia atual
        filenameDate = dayjs().format('DD.MM.YYYY');
    }

    const prazoD3 = calculateD3();
    
    // Nome do arquivo de saída
    const filename = `CITAÇÕES E INTIMAÇÕES PROJUDI ${filenameDate}.xlsx`;
    const folder = (args && args.outputDir) ? args.outputDir : process.cwd();
    const outputPath = path.join(folder, filename);

    // GERAÇÃO DO ARQUIVO DO ZERO (Sem depender de templates externos)
    // O usuário prefere criar a estrutura programaticamente para evitar dependências de arquivos.
    log(eventSender, "Gerando nova planilha formatada (sem depender de arquivo modelo)...");
    const workbook = new ExcelJS.Workbook();
    
    // Função de Estilo Padrão (Idêntico ao Modelo)
    const applyHeaderStyle = (sheet, columns_count) => {
        const row = sheet.getRow(1);
        row.height = 15.75; // Altura padrão do Excel para cabeçalhos (~21px)
        
        // Habilitar Filtros (Setas no cabeçalho)
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: columns_count }
        };

        for (let i = 1; i <= columns_count; i++) {
            const cell = row.getCell(i);
            // Fonte: Aptos Narrow, 11px, Negrito, Branco
            cell.font = { name: 'Aptos Narrow', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            
            // Fundo: Azul Petróleo/Teal (Aproximação do Theme 7 + Tint)
            // Cor sólida baseada na imagem enviada (Teal Escuro)
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF007296' } // Ajustado para o Teal do print
            };
            
            cell.alignment = { vertical: 'bottom', horizontal: 'center' };
            
            // Bordas Finas (Cinza Escuro/Preto)
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000'} },
                left: { style: 'thin', color: { argb: 'FF000000'} },
                bottom: { style: 'thin', color: { argb: 'FF000000'} },
                right: { style: 'thin', color: { argb: 'FF000000'} }
            };
        }
    };

    const applyDataBorderStyle = (sheet) => {
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    cell.font = { name: 'Aptos Narrow', size: 11, color: { argb: 'FF000000' } };
                    
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFBFBFBF'} }, // Cinza claro interno
                        left: { style: 'thin', color: { argb: 'FFBFBFBF'} },
                        bottom: { style: 'thin', color: { argb: 'FFBFBFBF'} },
                        right: { style: 'thin', color: { argb: 'FFBFBFBF'} }
                    };
                    
                    // Alinhamento: NPU (Col 1) pode ser Esquerda, Datas Centro
                    // No print parece tudo centralizado, exceto talvez textos longos.
                    // Vamos manter centralizado para ficar uniforme com datas.
                    cell.alignment = { vertical: 'bottom', horizontal: 'center' };
                });
            }
        });
    };

    // --- ABA CITAÇÕES ---
    // Nome exato conforme exemplo: CITAÇÕES - PROJUDI
    const wsCita = workbook.addWorksheet('CITAÇÕES - PROJUDI');
    wsCita.columns = [
        { header: 'NPU', key: 'npu', width: 25 },
        { header: 'DATA DE POSTAGEM', key: 'postagem', width: 20 },
        { header: 'CIÊNCIA AUTOMÁTICA (LEITURA)', key: 'ciencia', width: 30 },
        { header: 'DISTRIBUIÇÃO DA AÇÃO', key: 'distribuicao', width: 25 },
        { header: 'DATA DE ENVIO', key: 'envio', width: 18 },
        { header: 'PRAZO D+3', key: 'prazo', width: 18 }
    ];
    
    applyHeaderStyle(wsCita, 6);

    // --- ABA INTIMAÇÕES ---
    // Nome exato conforme exemplo: INTIMAÇÕES - PROJUDI
    const wsInti = workbook.addWorksheet('INTIMAÇÕES - PROJUDI');
    // REMOVIDO: Coluna vazia que existia antes. Agora são 5 colunas.
    wsInti.columns = [
        { header: 'NPU', key: 'npu', width: 25 },
        { header: 'DATA DE POSTAGEM', key: 'postagem', width: 20 },
        { header: 'DATA DE INTIMAÇÃO AUTOMÁTICA', key: 'intimacao', width: 32 },
        { header: 'DATA DE ENVIO', key: 'envio', width: 18 },
        { header: 'PRAZO D+3', key: 'prazo', width: 18 }
    ];

    applyHeaderStyle(wsInti, 5); // 5 colunas

    // Gravação dos Dados - CITAÇÕES
    log(eventSender, `Salvando ${recordsCita.length} Citações...`);
    recordsCita.forEach(r => {
        // [NPU, POSTAGEM, CIENCIA, ENTRADA, ENVIO(HOJE), D+3]
        wsCita.addRow([r.npu, r.dtPost, r.dtCiencia, r.dtEntrada, todayStr, prazoD3]);
    });

    // Gravação dos Dados - INTIMAÇÕES
    log(eventSender, `Salvando ${recordsInti.length} Intimações...`);
    recordsInti.forEach(r => {
        // [NPU, POSTAGEM, INTIMACAO, ENVIO(HOJE), D+3]
        // Usa dtIntimacao se existir, senão dtCiencia (fallback)
        const valIntimacao = r.dtIntimacao || r.dtCiencia || "";
        wsInti.addRow([r.npu, r.dtPost, valIntimacao, todayStr, prazoD3]);
    });

    // Aplica bordas nos dados APÓS inserir as linhas
    applyDataBorderStyle(wsCita);
    applyDataBorderStyle(wsInti);

    await workbook.xlsx.writeFile(outputPath);
    log(eventSender, `ARQUIVO SALVO: ${outputPath}`);
    eventSender.send('script-finished', 0); // Notifica Sucesso
}

async function saveEvidencePDF(screenshots, categoryName, args, eventSender) {
    if (!browser) return; // Segurança

    log(eventSender, `Gerando PDF de evidências para ${categoryName}...`);
    
    // 1. Definição do Nome do Arquivo (Mesma lógica do Excel)
    let filenameDate;
    if (args && (args.dateEnd || args.filterDate)) {
        let refDate = args.dateEnd || args.filterDate;
        const parts = refDate.split('-');
        filenameDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
        
        if (args.dateStart && args.dateEnd && args.dateStart !== args.dateEnd) {
             const pStart = args.dateStart.split('-');
             const fStart = `${pStart[2]}.${pStart[1]}.${pStart[0]}`;
             filenameDate = `${fStart} A ${filenameDate}`;
        }
    } else {
        filenameDate = dayjs().format('DD.MM.YYYY');
    }

    const nameUpper = categoryName.toUpperCase(); // CITAÇÕES ou INTIMAÇÕES
    const pdfName = `EVIDENCIAS DAS ${nameUpper} - PROJUDI DIA ${filenameDate}.pdf`;
    const folder = (args && args.outputDir) ? args.outputDir : process.cwd();
    const pdfPath = path.join(folder, pdfName);

    try {
        // 2. Monta HTML para Impressão
        let htmlContent = `
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #b30000; padding-bottom: 15px; }
                        .header h2 { margin: 0 0 10px 0; color: #b30000; text-transform: uppercase; }
                        .header p { margin: 5px 0; font-size: 14px; color: #333; }
                        
                        .page-container { page-break-after: always; margin-bottom: 50px; text-align: center; display: flex; flex-direction: column; align-items: center; }
                        .page-container:last-child { page-break-after: auto; }
                        
                        img { max-width: 100%; border: 1px solid #999; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); }
                        .footer { margin-top: 10px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>EVIDÊNCIAS - ${nameUpper}</h2>
                        <p>Data de Extração: ${dayjs().format('DD/MM/YYYY HH:mm:ss')}</p>
                        <p>Período de Referência: ${filenameDate}</p>
                    </div>
        `;

        screenshots.forEach((buff, idx) => {
            const b64 = buff.toString('base64');
            htmlContent += `
                <div class="page-container">
                    <img src="data:image/jpeg;base64,${b64}" />
                    <div class="footer">Página ${idx + 1} do Projudi</div>
                </div>
            `;
        });

        htmlContent += `</body></html>`;

        // 3. Usa o Playwright para renderizar e imprimir PDF
        const pdfPage = await browser.newPage();
        await pdfPage.setContent(htmlContent);
        
        await pdfPage.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await pdfPage.close();
        log(eventSender, `PDF GERADO: ${pdfName}`);

    } catch (e) {
        log(eventSender, `[ERRO] Falha ao gerar PDF de evidências: ${e.message}`, null, 'error');
        console.error(e);
    }
}

// =================================================================================================
// --- MÓDULO: PROCESSOS ARQUIVADOS ---
// =================================================================================================

async function runArchivedAutomation(eventSender, inputReceiver, args) {
    isStopping = false;
    log(eventSender, "Iniciando Robô de Arquivados", "Thread Start | Mode: Archived", 'info');
    
    try {
        // 1. Setup Browser (Cópia da função principal, idealmente seria refatorado)
        const edgePaths = [
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
        ];
        const edgeExe = edgePaths.find(p => fs.existsSync(p));
        if (!edgeExe) throw new Error("Edge não encontrado.");

        browser = await chromium.launch({
            executablePath: edgeExe,
            headless: false,
            args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
        });

        context = await browser.newContext({ viewport: null });
        page = await context.newPage();
        page.setDefaultTimeout(60000);

        // 2. Login
        log(eventSender, "Realizando login...", "Navigating to Projudi", 'info');
        await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded' });
        
        // --- LOGIN AUTOMÁTICO (Versão Robusta) ---
        if (args && args.user && args.pass) {
            log(eventSender, "Detectadas credenciais. Varrendo frames...", "Searching inputs", 'info');
            
            const findLoginInputs = async () => {
                const allFrames = [page, ...page.frames()];
                for (const frame of allFrames) {
                    try {
                        const l = frame.locator('input#login').first();
                        const s = frame.locator('input#senha').first();
                        // Verifica count > 0
                        if (await l.count() > 0 && await s.count() > 0) {
                             // Check visibility is tricky in frames, assumimos ok se existe no DOM
                            return { uInput: l, pInput: s };
                        }
                    } catch (e) { }
                }
                return null;
            };

            let inputs = null;
            for (let i = 0; i < 15; i++) {
                inputs = await findLoginInputs();
                if (inputs) break;
                await delay(1000);
            }

            if (inputs) {
                const { uInput, pInput } = inputs;
                log(eventSender, "Campos de Login Encontrados!");
                try {
                    await uInput.fill(args.user);
                    await delay(500);
                    await pInput.fill(args.pass);
                    await delay(500);
                    await pInput.press('Enter');
                    log(eventSender, "Credenciais submetidas.");
                } catch(e) {
                    log(eventSender, `Erro no preenchimento: ${e.message}`, null, 'error');
                }
            } else {
                log(eventSender, "Aviso: Campos de login automático não encontrados.", null, 'warn');
            }
        }
        
        // Espera estar logado (verifica Dashboard ou Botão COELBA)
        log(eventSender, "Aguardando Dashboard ou Seleção de Perfil...", "Waiting for access", 'info');
        
        // Tenta clicar Representação se aparecer
        for(let i=0; i<30; i++) { // 30 segundos polling
             if (isStopping) break;
             
             // Check Dashboard
             const txt = await page.evaluate(() => document.body.innerText).catch(() => "");
             if (txt.includes('Mesa de Trabalho') || txt.includes('Aguardando Leitura')) {
                 log(eventSender, "Dashboard detectado!", null, 'success');
                 break;
             }
             
             // Check Button Representation
             const allFrames = page.frames();
             for (const frame of allFrames) {
                 try {
                     const btn = frame.locator("a").filter({ hasText: /REPRESENTA.ÃO\s+COELBA/i }).first();
                     if (await btn.count() > 0 && await btn.isVisible()) {
                         log(eventSender, "Selecionando Perfil 'REPRESENTAÇÃO COELBA'...", null, 'info');
                         await btn.click();
                         await delay(5000); // Wait load
                     }
                 } catch(e) {}
             }
             await delay(1000);
        }

        // 3. Acessar URL direta de Arquivados
        const urlArquivados = "https://projudi.tjba.jus.br/projudi/listagens/ProcessosParte?tipo=arquivados&isParteOrgaoRep=true";
        log(eventSender, "Acessando Lista de Arquivados...", `URL: ${urlArquivados}`, 'info');
        
        // Tenta navegar no frame principal ou page
        let mainFrame = page.frames().find(f => f.name() === 'userMainFrame');
        if (mainFrame) {
            await mainFrame.goto(urlArquivados);
        } else {
             // Tentar navegar a página toda se o frame não for achado (pode causar logout, cuidado)
             // Melhor tentar achar o frame correto dinamicamente
             await page.goto(urlArquivados); // As vezes a URL direta redireciona o top frame corretamente
        }
        await delay(3000);

        // Atualiza referencia do frame
        mainFrame = page.frames().find(f => f.name() === 'userMainFrame') || page.mainFrame();

        // 4. Ordenação (Obrigatório)
        log(eventSender, "Aplicando ordenação por DATA (Ascendente)...", "Exec: javascript:ordenarLista(...)", 'info');
        try {
            await mainFrame.evaluate("ordenarLista('Processo.DATARECEBIMENTO','ASC')");
            await mainFrame.waitForNavigation({ waitUntil: 'domcontentloaded' }); // Recarrega
        } catch(e) {
            log(eventSender, "Erro ao ordenar lista. Tentando continuar...", e.message, 'warn');
        }

        // 5. Loop de Extração
        const allRecords = [];
        let currentPage = 1;
        let stopLoop = false;
        
        // Configuração do Range
        const mode = args.filterMode || 'pages'; // 'pages' | 'years'
        
        // Se for por PÁGINAS, definimos o start/end
        let pageStart = 1;
        let pageEnd = 1000;
        if (mode === 'pages') {
            pageStart = args.rangeStart || 1;
            pageEnd = args.rangeEnd || 1;
        }
        
        // Se for por ANOS, começamos da 1 e vamos até achar ano > yearEnd
        // Mas o usuário pode ter pedido Page navigation too. 
        // O prompt diz: "OU escolher paginas OU escolher anos"
        
        if (pageStart > 1) {
             log(eventSender, `Navegando para página inicial ${pageStart}...`, "Jump to page", 'info');
             try {
                 await mainFrame.evaluate(`goToPage(${pageStart})`);
                 await mainFrame.waitForNavigation();
                 currentPage = pageStart;
             } catch(e) {
                 log(eventSender, "Falha ao pular página inicial.", e.message, 'error');
             }
        }

        while (!stopLoop && !isStopping) {
            log(eventSender, `Processando página ${currentPage}...`, `Scaling table data`, 'info');
            
            // Extração da Tabela
            // Seletor baseado no HTML fornecido: tr contendo checkbox name="processos"
            // As colunas são: Check(0), NPU(1), Promovente(2), Promovido(3), Distribuicao(4), Classe(5)
            
            const rows = await mainFrame.locator('tr').filter({ has: mainFrame.locator('input[name="processos"]') }).all();
            
            if (rows.length === 0) {
                log(eventSender, "Nenhum processo encontrado nesta página.", null, 'warn');
                // Se não achou nada e estamos no modo Paginas, talvez tenha acabado.
                if (mode === 'pages' && currentPage >= pageEnd) break;
            }

            let recordsInPage = 0;

            for (const row of rows) {
                const tds = await row.locator('td').all();
                if (tds.length < 6) continue;

                // Extração dos Textos
                const npuRaw = await tds[1].innerText(); // "0011774-48...\nNOME"
                const npu = npuRaw.split('\n')[0].trim(); // Pega só o número
                const promovente = (await tds[2].innerText()).replace(/\n/g, ' ').trim();
                const promovido = (await tds[3].innerText()).replace(/\n/g, ' ').trim();
                const dataDistripRaw = await tds[4].innerText(); // "26/07/10"
                const classe = await tds[5].innerText();
                
                // Parse Data (dd/mm/yy -> YYYY)
                const parts = dataDistripRaw.trim().split('/');
                let year = 0;
                let fullDate = dataDistripRaw.trim();
                
                if (parts.length === 3) {
                    year = parseInt(parts[2]);
                    if (year < 100) year += 2000; // Assumindo 20xx (Projudi antigo pode ter 19xx? O script assume 20xx)
                    // Correção segura: "10" é 2010. "99" pode ser 1999. 
                    // Melhor: Se ano < 50 assume 20xx, se > 50 assume 19xx?
                    // O HTML mostra "26/07/10", que é 2010.
                    
                    // Formatação para Excel (Texto 123)
                    fullDate = `${parts[0]}/${parts[1]}/${year}`;
                }

                // FILTRAGEM POR ANO
                if (mode === 'years') {
                    const yStart = args.rangeStart;
                    const yEnd = args.rangeEnd;
                    
                    // Se o ano desta linha for MAIOR que o fim, e a lista é Ascendente (crescente), podemos PARAR TUDO.
                    if (year > yEnd) {
                        stopLoop = true;
                        log(eventSender, `Ano ${year} excedeu o limite (${yEnd}). Parando extração.`, "Year limit reached", 'info');
                        break; 
                    }
                    
                    // Se o ano for MENOR que o inicio, continuamos para próxima linha/pagina
                    if (year < yStart) continue; 
                }

                allRecords.push({
                    npu, promovente, promovido, data: fullDate, classe
                });
                recordsInPage++;
            }

            if (stopLoop) break;

            // Controle de Paginação
            if (mode === 'pages') {
                if (currentPage >= pageEnd) {
                    log(eventSender, "Fim do intervalo de páginas solicitado.", null, 'success');
                    break;
                }
            }
            
            // Navegar Próxima
            try {
                // Tenta botão próxima
                const nextBtn = mainFrame.locator('a[title="próxima página"]').first();
                
                // Verifica visibilidade antes de clicar
                if (await nextBtn.isVisible({ timeout: 5000 })) {
                    // Start waiting for navigation *before* clicking to avoid race condition
                    await Promise.all([
                        mainFrame.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
                        nextBtn.click()
                    ]);
                    currentPage++;
                } else {
                    log(eventSender, "Fim da paginação (Botão 'Próxima' não visível).", null, 'warn');
                    break;
                }
            } catch(e) {
                log(eventSender, `Erro de Navegação (Pág ${currentPage}->${currentPage+1}): ${e.message}`, null, 'error');
                break;
            }
            
            log(eventSender, `Página ${currentPage-1} processada. Total acumulado: ${allRecords.length}`, null, 'info');
        }

        // 6. Salvar Excel
        if (allRecords.length > 0) {
            await saveArchivedExcel(allRecords, args, eventSender);
        } else {
            log(eventSender, "Nenhum arquivo gerado (zero registros).", null, 'warn');
        }

        eventSender.send('script-finished', 0);

    } catch (e) {
        log(eventSender, `Erro Fatal: ${e.message}`, e.stack, 'error');
        eventSender.send('script-finished', 1);
    } finally {
        if (browser) await browser.close();
    }
}

async function saveArchivedExcel(records, args, eventSender) {
    log(eventSender, "Filtrando e Gerando planilha Excel...", "Filter & Write", 'info');
    
    // --- Lógica de Filtragem de Anos Incompletos ---
    // Agrupa por ano e mês para analisar distribuição
    // records devem ter .data (dd/mm/yyyy)
    const yearStats = {}; // { 2015: { months: Set(), count: 10 }, 2016: ... }
    
    records.forEach(r => {
        try {
            const parts = r.data.split('/'); // dd, mm, yyyy
            if (parts.length === 3) {
                const y = parseInt(parts[2]);
                const m = parseInt(parts[1]);
                if (!yearStats[y]) yearStats[y] = { months: new Set(), count: 0, minMonth: 12, maxMonth: 1 };
                yearStats[y].months.add(m);
                yearStats[y].count++;
                if (m < yearStats[y].minMonth) yearStats[y].minMonth = m;
                if (m > yearStats[y].maxMonth) yearStats[y].maxMonth = m;
            }
        } catch(e) {}
    });
    
    const yearsFound = Object.keys(yearStats).map(y => parseInt(y)).sort((a,b) => a - b);
    let finalRecords = records;

    if (yearsFound.length > 1) {
        log(eventSender, "Detectados múltiplos anos no range. Analisando consistência...", `Years: ${yearsFound.join(', ')}`, 'info');
        const yearsToKeep = [];
        
        // Ordena anos. Geralmente queremos "miolo" ou anos substanciais.
        // Regra: Remover anos das pontas se tiverem poucos meses representados, A MENOS que sejam os unicos.
        // Se YearCount > 1.
        
        yearsFound.forEach((year, index) => {
            const stat = yearStats[year];
            const isEdge = (index === 0 || index === yearsFound.length - 1);
            const monthSpan = (stat.maxMonth - stat.minMonth) + 1; // Ex: Jan(1) to Mar(3) = 3 months
            const distinctMonths = stat.months.size;
            
            // Critério de Corte: Se for borda E tiver menos que 6 meses de amplitude E tiver outro ano "completo" no set.
            // Para simplificar: Se a borda tiver só Dezembro (1 mês) ou só Janeiro (1 mês), removemos.
            
            let keep = true;
            if (isEdge) {
                // Se for borda e tiver menos de 4 meses distintos representados, consideramos "resto" de paginação.
                // Ajustável conforme necessidade. O usuário citou "dezembro de um ano" e "janeiro do outro".
                if (distinctMonths < 4) {
                    keep = false;
                    log(eventSender, `Filtrando ano ${year} (Borda Incompleta: ${distinctMonths} meses detectados).`, null, 'warn');
                }
            }
            if (keep) yearsToKeep.push(year);
        });

        // Segurança: Se filtrar tudo, mantém o original (pelo menos algo é salvo)
        if (yearsToKeep.length > 0) {
            finalRecords = records.filter(r => {
                 const y = parseInt(r.data.split('/')[2]);
                 return yearsToKeep.includes(y);
            });
            log(eventSender, `Registros Filtrados: ${finalRecords.length} (Original: ${records.length})`, null, 'success');
        } else {
             log(eventSender, "Filtro removeria tudo. Mantendo todos os registros.", null, 'warn');
        }
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Processos Arquivados');

    // --- Título e Metadata ---
    sheet.mergeCells('A1:E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'PROCESSOS ARQUIVADOS';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Green Matches App
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    sheet.mergeCells('A2:E2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Extraído em: ${dayjs().format('DD/MM/YYYY HH:mm')} | Total Registros: ${finalRecords.length}`;
    subCell.font = { italic: true, size: 11 };
    subCell.alignment = { horizontal: 'center' };

    // --- Headers (Linha 4 agora) ---
    // Definimos colunas mas escrevemos header manual para customizar linha 4
    const headers = ['Nº PROCESSO', 'PROMOVENTE', 'PROMOVIDO', 'DISTRIBUIÇÃO', 'CLASSE'];
    sheet.getRow(4).values = headers;
    
    // Configura Larguras
    sheet.getColumn(1).width = 25;
    sheet.getColumn(2).width = 40;
    sheet.getColumn(3).width = 40;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 30;

    // Estilo Header
    const headerRow = sheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }; // Dark Grey

    // --- Dados ---
    // Adiciona a partir da linha 5
    finalRecords.forEach(r => {
        const row = sheet.addRow([r.npu, r.promovente, r.promovido, r.data, r.classe]);
        // Ajuste manual de index se usar addRow com array (addRow append no fim)
        // Como definimos header na row 4 e cells 1/2 ocupados, addRow vai para row 5+ OK.
    });

    // Formatação NPU (Texto) - Iterar celulas da coluna A e setar formato
    // (ExcelJS addRow não herda col specs se não usar key mapping, mas setup manual resolve)
    sheet.getColumn(1).eachCell((cell, rowNumber) => {
        if (rowNumber > 4) cell.numFmt = '@';
    });

    const filename = `ARQUIVADOS_PROJUDI_${dayjs().format('DD-MM-YYYY_HHmm')}.xlsx`;
    const folder = (args && args.outputDir) ? args.outputDir : process.cwd();
    const outputPath = path.join(folder, filename);
    
    await workbook.xlsx.writeFile(outputPath);
    log(eventSender, `Arquivo Salvo: ${outputPath}`, null, 'success');
}

// --- INTEGRAÇÃO PJE ---

// Helper para esperar input do usuário via IPC
function waitForInput(eventSender, ipcReceiver, type, data) {
    return new Promise((resolve) => {
        // Envia requisição para Renderer
        eventSender.send('request-pje-input', { type, ...data });

        // Handler único para resolver essa promise
        const handler = (response) => {
            ipcReceiver.off('pje-input-received', handler); // Limpa listener
            resolve(response);
        };

        ipcReceiver.on('pje-input-received', handler);
    });
}

async function runPjeAutomation(eventSender, ipcReceiver, args) {
    isStopping = false;
    log(eventSender, "Iniciando Extrator PJE (1º e 2º Grau)...", "Start PJE Service", 'info');
    
    // Configurações e URLs
    const PJE_1_URL = "https://pje.tjba.jus.br/pje/";
    const PJE_2_URL = "https://pje2g.tjba.jus.br/pje/";

    try {
        // 1. Inicializar Browser
        log(eventSender, "Abrindo navegador...", "Edge Chromium", 'info');
        const edgePaths = [
            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
        ];
        const edgeExe = edgePaths.find(p => fs.existsSync(p));
        
        browser = await chromium.launch({
            executablePath: edgeExe,
            headless: false,
            args: ["--start-maximized", "--disable-blink-features=AutomationControlled"]
        });

        // If the user previously imported a PJE storageState, reuse it to avoid repeated 2FA/logins
        try {
            const pjeStorage = path.join(app.getPath('userData'), 'playwright-storage', 'pje.json');
            const localPjeStorage = path.join(__dirname, 'playwright-storage', 'pje.json');
            const contextOptions = { viewport: null };

            if (fs.existsSync(pjeStorage)) {
                log(eventSender, `PJE session storage found in userData. Reusing storageState: ${pjeStorage}`, 'PJE Session', 'info');
                contextOptions.storageState = pjeStorage;
            } else if (fs.existsSync(localPjeStorage)) {
                log(eventSender, `PJE session storage found in project. Reusing storageState: ${localPjeStorage}`, 'PJE Session', 'info');
                contextOptions.storageState = localPjeStorage;
            } else {
                log(eventSender, 'No PJE session storage found. Will require manual login.', 'PJE Session', 'info');
            }

            context = await browser.newContext(contextOptions);
            page = await context.newPage();
        } catch (e) {
            // Fallback to default newContext if anything goes wrong
            log(eventSender, `Aviso: não foi possível carregar storageState: ${e && e.message ? e.message : String(e)}. Abrindo contexto limpo.`, 'PJE Session', 'warn');
            context = await browser.newContext({ viewport: null });
            page = await context.newPage();
        }
        
        // Helper: safe page.evaluate with retries if execution context is destroyed (happens on navigation)
        const safeEvaluate = async (fn, ...fnArgs) => {
            const maxAttempts = 5; // increased retries to handle slower navigations
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await page.evaluate(fn, ...fnArgs);
                } catch (e) {
                    const msg = (e && e.message) ? e.message : String(e);
                    if (msg.includes('Execution context was destroyed') || msg.includes('Target closed') || msg.includes('Cannot find context')) {
                        log(eventSender, `Aviso: Execution context destruído durante page.evaluate (tentativa ${attempt}). Aguardando recarregamento...`, null, 'warn');
                        // Wait for load state and allow extra time for redirects to settle
                        try { await page.waitForLoadState('domcontentloaded', { timeout: 10000 }); } catch(err){}
                        await delay(1500);

                        // On last attempt, attempt a reload to recover a usable execution context
                        if (attempt === maxAttempts) {
                            try {
                                log(eventSender, 'Tentando recarregar a página para recuperar o contexto...', null, 'warn');
                                await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
                                await delay(1000);
                                // Final retry after reload
                                return await page.evaluate(fn, ...fnArgs);
                            } catch (reloadErr) {
                                log(eventSender, `Falha ao recarregar página: ${reloadErr && reloadErr.message ? reloadErr.message : String(reloadErr)}`, null, 'warn');
                            }
                        }

                        continue; // retry
                    }
                    throw e; // rethrow other errors
                }
            }
            throw new Error('safeEvaluate: excedeu tentativas devido a Execution context destroyed');
        }

        // Helper: click with retries and recovery (works with ElementHandle or selector string)
        const clickWithRetries = async (target, desc = 'element', maxAttempts = 4) => {
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    if (isStopping) throw new Error('STOP_REQUESTED');
                    let handle = null;
                    if (typeof target === 'string') {
                        handle = await page.$(target);
                    } else {
                        handle = target;
                    }
                    if (!handle) {
                        // If we don't have a handle, try a small wait and retry
                        await delay(500 + attempt * 200);
                        continue;
                    }
                    try {
                        await handle.click({ timeout: 5000 });
                        return true;
                    } catch (clickErr) {
                        try {
                            // fallback to evaluate click inside page
                            await handle.evaluate(n => { n.click(); });
                            return true;
                        } catch (evalErr) {
                            const msg = (evalErr && evalErr.message) ? evalErr.message : String(evalErr);
                            // If context destroyed, allow safeEvaluate style recovery
                            if (msg.includes('Execution context was destroyed') || msg.includes('Target closed') || msg.includes('Cannot find context')) {
                                log(eventSender, `Aviso: contexto destruído ao clicar (${desc}) (tentativa ${attempt}). Esperando e tentando novamente...`, null, 'warn');
                                try { await page.waitForLoadState('domcontentloaded', { timeout: 10000 }); } catch(__){}
                                await delay(800 + attempt * 300);
                                continue; // next attempt
                            }
                            // otherwise continue retrying
                            await delay(400 + attempt * 200);
                            continue;
                        }
                    }
                } catch (err) {
                    if (err && err.message === 'STOP_REQUESTED') throw err;
                    // last attempt fallthrough
                    if (attempt === maxAttempts) {
                        throw new Error(`CLICK_FAILED: ${desc} (${err && err.message ? err.message : String(err)})`);
                    }
                    await delay(300 + attempt * 200);
                }
            }
            throw new Error(`CLICK_FAILED: ${desc}`);
        };;

        // Path where we will persist storageState (userData preferred)
        const PJE_STORAGE = path.join(app.getPath('userData'), 'playwright-storage', 'pje.json');

        // Ensure directory exists for storageState
        try { if (!fs.existsSync(path.dirname(PJE_STORAGE))) fs.mkdirSync(path.dirname(PJE_STORAGE), { recursive: true }); } catch (e) {}

        // Encapsulate PJE 1 and PJE 2 routines so we can choose execution order easily
        let dadosPje1 = {};
        let dadosPje2 = {};

        const runPje1 = async () => {
            log(eventSender, "Acessando PJE 1º Grau (verificando sessão)...", null, 'info');
            try {
                await page.goto(PJE_1_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await delay(2000); // aguarda renderização inicial
            } catch(e) { log(eventSender, `Nav erro (ignorado): ${e.message}`, 'PJE Nav', 'warn'); }

            // Verificação inteligente de sessão
            const isLogged = await safeEvaluate(() => {
                const bodyText = document.body ? document.body.innerText : '';
                // Termos comuns do painel logado
                return bodyText.includes('Mesa de Trabalho') || 
                       bodyText.includes('Painel do advogado') || 
                       bodyText.includes('Aguardando Leitura') ||
                       !!document.querySelector('a[href*="logout"]');
            }).catch(() => false);

            if (isLogged) {
                log(eventSender, "Sessão PJE 1º Grau válida detectada! (Reutilizando storage)", 'PJE Session', 'success');
                // Salvar novamente para renovar timestamp do arquivo se desejar, mas não estritamente necessário
            } else {
                log(eventSender, "Sessão não detectada. Solicitando login manual...", 'PJE Session', 'warn');
                const login1 = await waitForInput(eventSender, ipcReceiver, 'confirm', {
                    title: 'Login Necessário - PJE 1º Grau',
                    message: '1. Realize o login no PJE 1º Grau.\n2. **SELECIONE O PERFIL DE PROCURADORIA** no topo da tela.\n3. Aguarde o painel inicial carregar.\n\nClique em Continuar APÓS selecionar o perfil correto.',
                    confirmText: 'Continuar'
                });

                if (login1 === false || login1 === 'cancel') { 
                    log(eventSender, 'Login PJE 1 cancelado/recusado. Pulando etapa.', null, 'warn'); 
                    return; 
                }

                // Se o usuário confirmou, assumimos que logou. Salvamos o estado novo.
                try {
                    await context.storageState({ path: PJE_STORAGE });
                    log(eventSender, `Login novo detectado. Sessão salva em: ${PJE_STORAGE}`, 'PJE Session', 'success');
                } catch (e) {
                    log(eventSender, `Erro salvando sessão PJE (1): ${e && e.message ? e.message : String(e)}`, 'PJE Session', 'warn');
                }
            }

            // Ensure the page is on the expected PJE 1 URL and stable before running evaluations
            try {
                try { await page.waitForLoadState('domcontentloaded', { timeout: 15000 }); } catch (__) {}
                await delay(800);
                const curUrl = page.url ? page.url() : '';
                if (!curUrl || !curUrl.startsWith(PJE_1_URL)) {
                    log(eventSender, `URL atual inesperada (${curUrl}). Navegando para ${PJE_1_URL} para estabilizar.`, 'PJE Session', 'warn');
                    await page.goto(PJE_1_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await delay(1500);
                }

                // Wait for dashboard indicators (Mesa de Trabalho, Aguardando Leitura, tree nodes or Expedientes tab)
                const indicators = ['text=Mesa de Trabalho', 'text=Aguardando Leitura', 'span.nomeTarefa', '#tabExpedientes_lbl'];
                let foundIndicator = false;
                const startWait = Date.now();
                const overallTimeout = 30000;
                let lastLog = Date.now();
                while (Date.now() - startWait < overallTimeout) {
                    if (isStopping) throw new Error('STOP_REQUESTED');
                    for (const sel of indicators) {
                        try {
                            const handle = await page.$(sel);
                            if (handle) {
                                log(eventSender, `Indicador de painel detectado: ${sel}`, 'PJE Session', 'info');
                                foundIndicator = true;
                                break;
                            }
                        } catch (e) { /* ignore and try next */ }
                    }
                    if (foundIndicator) break;
                    // periodic status log to show we're waiting (every 5s)
                    if (Date.now() - lastLog > 5000) {
                        log(eventSender, `Aguardando indicador do painel... (${Math.round((Date.now()-startWait)/1000)}s)`, 'PJE Session', 'info');
                        lastLog = Date.now();
                    }
                    await delay(500);
                }
                if (!foundIndicator) {
                    log(eventSender, 'Aviso: não foi detectado indicador claro do painel após login (após timeout). Tentando recarregar e re-verificar...', 'PJE Session', 'warn');
                    try {
                        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
                        await delay(1000);
                        // try one more quick scan
                        for (const sel of indicators) {
                            try { if (await page.$(sel)) { log(eventSender, `Indicador de painel detectado após reload: ${sel}`, 'PJE Session', 'info'); foundIndicator = true; break; } } catch (__){}
                        }
                    } catch (reloadErr) {
                        log(eventSender, `Reload falhou: ${reloadErr && reloadErr.message ? reloadErr.message : String(reloadErr)}`, 'PJE Session', 'warn');
                    }
                }
                if (!foundIndicator) {
                    log(eventSender, 'Aviso: indicador do painel não encontrado após tentativas. Prosseguindo mesmo assim (pode falhar).', 'PJE Session', 'warn');
                }
            } catch (e) {
                log(eventSender, `Aviso ao estabilizar página PJE1: ${e && e.message ? e.message : String(e)}`, 'PJE Session', 'warn');
            }

            log(eventSender, "Confirmado. Iniciando varredura PJE 1...", null, 'info');

            // Navegação PJE 1 (reimplementada via Playwright em Node para logging detalhado)
            try {
                log(eventSender, `Navegando para PJE 1 (URL alvo: ${PJE_1_URL})`, 'Navigation', 'info');
                // Re-navega para garantir o dashboard
                try { await page.goto(PJE_1_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); } catch (e) { log(eventSender, `Aviso: erro ao goto PJE1: ${e.message}`, 'Navigation', 'warn'); }
                await delay(1000);
                log(eventSender, `URL atual após goto: ${page.url()}`, 'Navigation', 'info');

                // 1) Selecionar perfil de Procuradoria (HTML Específico)
                try {
                    // Clica no menu dropdown do usuário
                    const menuLink = await page.$('.menu-usuario .dropdown-toggle');
                    if (menuLink && await menuLink.isVisible()) {
                        log(eventSender, "Abrindo menu de usuário...", 'Navigation', 'info');
                        await menuLink.click();
                        await delay(800);
                        
                        // Localiza o link específico da Procuradoria
                        // Procura por qualquer link que tenha "Procuradoria" E ("Coelba" ou "Eletricidade")
                        const profileLink = await page.evaluateHandle(() => {
                             const anchors = Array.from(document.querySelectorAll("#papeisUsuarioForm\\:dtPerfil a"));
                             return anchors.find(a => {
                                 const t = (a.innerText || "").toUpperCase();
                                 return t.includes("PROCURADORIA") && (t.includes("COELBA") || t.includes("ELETRICIDADE"));
                             });
                        });

                        if (profileLink) {
                             const nomePerfil = await profileLink.evaluate(el => el.innerText);
                             log(eventSender, `Perfil encontrado: ${nomePerfil}. Trocando...`, 'Navigation', 'info');
                             
                             // Dispara o clique nativo do JSF (onclick)
                             await profileLink.evaluate(el => el.click());
                             
                             // Aguarda reload (pode demorar)
                             log(eventSender, "Aguardando recarregamento do perfil...", 'Navigation', 'warn');
                             await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => log(eventSender, "Timeout aguardando nav (pode ter ido via AJAX).", 'Nav', 'warn'));
                             await delay(3000);
                        } else {
                            log(eventSender, "Perfil de Procuradoria não encontrado na lista.", 'Navigation', 'warn');
                        }
                    }
                } catch (e) { log(eventSender, `Erro na troca de perfil: ${e.message}`, 'Navigation', 'warn'); }

                // 2) Clicar em Expedientes (HTML Específico)
                try {
                    // ID exato do HTML fornecido
                    const tabExp = await page.$('#tabExpedientes_lbl');
                    if (tabExp) {
                         // Verifica se já está ativo (active)
                        const classes = await tabExp.getAttribute('class');
                        if (classes && !classes.includes('rich-tab-header-act')) {
                            log(eventSender, 'Clicando na aba Expedientes...', 'Navigation', 'info');
                            // Clique JSF nativo
                            await tabExp.evaluate(el => el.click());
                            await delay(4000); // Aguarda AJAX
                        } else {
                            log(eventSender, 'Aba Expedientes já ativa.', 'Navigation', 'info');
                        }
                    } else {
                        // Fallback classe
                        const tabExpCls = await page.$('.abaExpediendes');
                        if(tabExpCls) {
                             await tabExpCls.evaluate(el => el.click());
                             await delay(4000);
                        }
                    }
                } catch (e) { log(eventSender, `Erro ao clicar Expedientes: ${e.message}`, 'Navigation', 'warn'); }

                // 3) Navegação interna (Pendentes) - Igual ao PJE 2 (Injeção é melhor aqui)
                // A lógica abaixo tenta clicar nos nós da árvore. Se falhar, a extração via script injetado (mais abaixo) tenta "expandir menus".
                
                try {
                    const exactXPath = "//span[contains(@class,'nomeTarefa') and normalize-space(text())='Pendentes de ciência ou de resposta']";
                    // Tenta clicar via evaluate direto para evitar problemas de coordenadas
                    const clicked = await page.evaluate(async (xp) => {
                        const node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        if (node) { node.click(); return true; }
                        return false;
                    }, exactXPath);

                    if (clicked) {
                        log(eventSender, "Nó 'Pendentes' clicado.", 'Navigation', 'info');
                        await delay(5000);
                    } else {
                        // Fallback genérico
                         await page.evaluate(async () => {
                             const spans = Array.from(document.querySelectorAll("span.nomeTarefa"));
                             const target = spans.find(s => s.innerText.includes("Pendentes de ci") || s.innerText.includes("Pendentes de re"));
                             if(target) target.click();
                         });
                         await delay(5000);
                    }
                } catch(e) { /* ignore */ }
                
            } catch (e) {
                log(eventSender, `Erro durante navegação PJE1: ${e && e.message ? e.message : String(e)}`, 'Navigation', 'error');
            }

            } catch (e) {
                log(eventSender, `Erro durante navegação PJE1: ${e && e.message ? e.message : String(e)}`, 'Navigation', 'error');
            }

            // SCAN PJE 1
            const scanPje1 = await safeEvaluate(async () => {
                let nosIniciais = Array.from(document.querySelectorAll("span.nomeTarefa"));
                let listaAlvos = nosIniciais.filter(el => {
                    const nome = el.innerText.trim();
                    return nome &&
                        !nome.includes("Caixa de entrada") &&
                        !nome.includes("Pendentes") &&
                        !nome.includes("Expedientes") &&
                        !nome.includes("Acervo") &&
                        !nome.includes("Minhas petições") &&
                        !nome.includes("Ciência") &&
                        !nome.includes("Prazo") &&
                        !nome.includes("Respondidos") &&
                        !nome.includes("Apenas") &&
                        !nome.includes("Sem prazo") &&
                        !nome.match(/^\d+$/);
                }).map(el => el.innerText.trim());
                listaAlvos = [...new Set(listaAlvos)];
                listaAlvos.sort((a, b) => a.localeCompare(b));
                return listaAlvos;
            });

            if (scanPje1 && scanPje1.length > 0) {
                log(eventSender, `PJE 1: Encontradas ${scanPje1.length} jurisdições/cidades.`, null, 'success');
                const qtd1 = await waitForInput(eventSender, ipcReceiver, 'number', {
                    title: 'PJE 1 - Quantidade',
                    message: `PJE 1: ${scanPje1.length} locais encontrados. Quantos processar?`,
                    max: scanPje1.length
                });
                const limite1 = parseInt(qtd1);
                log(eventSender, `Processando ${limite1} locais do PJE 1...`, null, 'info');

                for (let i = 0; i < limite1; i++) {
                    if(isStopping) break;
                    const cidadeNome = scanPje1[i];
                    log(eventSender, `(PJE 1) Extraindo: ${cidadeNome}...`, null, 'info');

                    let processosCidade = null;
                    try {
                        processosCidade = await safeEvaluate(async (cidadeNome) => {
                            const esperar = (ms) => new Promise(res => setTimeout(res, ms));
                            const limparTexto = (t) => t ? t.split('\n').map(l=>l.trim()).filter(l=>l.length>0).join('\n') : "";

                            // --- FUNCOES DE NAVEGACAO E PAGINACAO ROBUSTA (Do Script DevTools) ---
                            // Helper: find pager
                            const findPager = (tbl) => {
                                let el = tbl; while(el && el!==document.body){ if(el.querySelector && el.querySelector('.rich-datascr-button')) return el; el=el.parentElement; }
                                const near = document.querySelectorAll('.rich-datascr');
                                for(const n of near) if(n.contains(tbl) || tbl.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_PRECEDING) return n;
                                return null;
                            };
                            const isVisible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
                            const isDisabled = (el) => {
                                if(!el) return true;
                                if(el.classList && el.classList.contains('rich-datascr-inact')) return true;
                                if(el.getAttribute && el.getAttribute('aria-disabled')==='true') return true;
                                return !!(el.style && (el.style.display==='none' || el.style.visibility==='hidden'));
                            };

                            const tryExpandMenus = async () => {
                                const preferred = ["Pendentes de ciência ou de resposta", "Pendentes de ciência", "Pendentes de resposta", "Expedientes", "Caixa de entrada"];
                                for (const menu of preferred) {
                                    let menuXpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${menu}"]`;
                                    let menuNode = document.evaluate(menuXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                    if (!menuNode) {
                                        menuXpath = `//span[contains(@class, 'nomeTarefa') and contains(normalize-space(text()), "${menu}")]`;
                                        menuNode = document.evaluate(menuXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                    }
                                    if (menuNode) {
                                        menuNode.click();
                                        await esperar(1000);
                                        const cityXpath = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${cidadeNome}"]`;
                                        const found = document.evaluate(cityXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                                        if (found) return;
                                    }
                                }
                            };

                            // Activate city logic
                            const activateCityWithRetries = async (nm, attempts=3) => {
                                const xp = `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${nm}"]`;
                                for(let attempt=1; attempt<=attempts; attempt++){
                                    if(attempt > 1) await tryExpandMenus();
                                    let res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                                    let node = res.singleNodeValue;
                                    if(!node) { await esperar(500); res = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null); node = res.singleNodeValue; }
                                    if(!node) continue;
                                    
                                    const clickable = node.closest('a') || node;
                                    try{ clickable.scrollIntoView({block:'center',behavior:'auto'}); }catch(e){}
                                    await esperar(300);
                                    try{ clickable.click(); }catch(e){}
                                    try{ clickable.dispatchEvent(new MouseEvent('click', {view:window,bubbles:true,cancelable:true})); }catch(e){}
                                    
                                    await esperar(4000); // Wait for load
                                    const tabela = document.querySelector("table[id$='tbExpedientes']");
                                    if(tabela && tabela.querySelectorAll('tbody > tr').length > 0) return true;
                                    await esperar(300);
                                }
                                return false;
                            };

                            const ativado = await activateCityWithRetries(cidadeNome);
                            if(!ativado) return null;

                            // Extraction loop
                            let data = [];
                            const tableSel = "table[id$='tbExpedientes']";
                            const tableEl = document.querySelector(tableSel);
                            const pager = tableEl ? findPager(tableEl) : null;
                            const seenFirsts = new Set();
                            const MAX_PAGES = 400;
                            let guard = 0;

                            while (true) {
                                let linhas = document.querySelectorAll(tableSel + " > tbody > tr");
                                if (linhas.length > 0) {
                                    const firstTxt = linhas[0].innerText.trim();
                                    if(seenFirsts.has(firstTxt)) break; // loop detected
                                    seenFirsts.add(firstTxt);
                                    linhas.forEach(linha => {
                                        let cels = linha.querySelectorAll("td");
                                        if (cels.length >= 3) {
                                            let txt = limparTexto(cels[1].innerText + "\n" + cels[2].innerText);
                                            if (!data.includes(txt)) data.push(txt);
                                        }
                                    });
                                }

                                // Find next button
                                let btnNext = null;
                                if(pager) {
                                    const cands = Array.from(pager.querySelectorAll('.rich-datascr-button, button, a'));
                                    const pref = cands.find(b => {
                                        const oc = (b.getAttribute('onclick')||'').toLowerCase();
                                        const x = (b.innerText||'').trim();
                                        return (oc.includes('fastforward')||oc.includes('next')||['»','>>','>','Próxima'].includes(x));
                                    });
                                    if(pref && isVisible(pref)) btnNext=pref;
                                    else btnNext = cands.find(c => isVisible(c) && !isDisabled(c));
                                }
                                if(!btnNext) {
                                     // Fallback global
                                     btnNext = document.querySelector(".rich-datascr-button[onclick*='fastforward']") 
                                              || document.querySelector(".rich-datascr-button[onclick*='next']");
                                }

                                if (btnNext && !isDisabled(btnNext)) {
                                    btnNext.click();
                                    // Wait for change
                                    const prevCount = linhas.length;
                                    const prevFirst = linhas[0]?linhas[0].innerText.trim():'';
                                    let changed = false;
                                    for(let w=0; w<15; w++){
                                        await esperar(500);
                                        const curRows = document.querySelectorAll(tableSel + " > tbody > tr");
                                        const curFirst = curRows[0]?curRows[0].innerText.trim():'';
                                        if(curRows.length !== prevCount || curFirst !== prevFirst){ changed=true; break; }
                                    }
                                    if(!changed) break; // stuck
                                    guard++; if(guard > MAX_PAGES) break;
                                } else {
                                    break;
                                }
                            }
                            return data;

                        }, cidadeNome);
                    } catch (errCidade) {
                        log(eventSender, `Erro ao extrair ${cidadeNome}: ${errCidade.message}`, errCidade.stack, 'error');
                        continue;
                    }

                    if (processosCidade) {
                        dadosPje1[cidadeNome] = processosCidade;
                        log(eventSender, `   > ${processosCidade.length} expedientes.`, null, 'success');
                    } else {
                        log(eventSender, `   > Não foi possível acessar.`, null, 'error');
                    }
                }

            } else {
                log(eventSender, "PJE 1: Nenhuma cidade encontrada (verifique se a árvore 'Expedientes' está aberta).", null, 'warn');
            }
        };

        const runPje2 = async () => {
            log(eventSender, "Acessando PJE 2º Grau...", PJE_2_URL, 'info');
            await page.goto(PJE_2_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
            await delay(2000);

            // Aguarda estabilização da página (assumindo sessão do PJE 1)
            try {
                // Tenta esperar indicadores de sucesso
                await Promise.any([
                    page.waitForSelector('text=Mesa de Trabalho', { timeout: 15000 }),
                    page.waitForSelector('#tabExpedientes_lbl', { timeout: 15000 }),
                    page.waitForSelector('span.nomeTarefa', { timeout: 15000 }),
                    page.waitForSelector('td.rich-tab-header', { timeout: 15000 })
                ]).catch(() => {});
                
                log(eventSender, "PJE 2 carregado/estabilizado.", null, 'info');
            } catch (e) {
                log(eventSender, "Aviso: Tempo limite aguardando carga completa do PJE 2.", null, 'warn');
            }

            log(eventSender, "Iniciando navegação interna PJE 2 (Modo Cirúrgico)...", null, 'info');

            // --- NAVEGAÇÃO PJE 2 (REPLICADA DO PJE 1) ---
            
            try {
                 // 1) Selecionar perfil de Procuradoria (Se necessário)
                try {
                    // Clica no menu dropdown do usuário
                    const menuLink = await page.$('.menu-usuario .dropdown-toggle');
                    if (menuLink && await menuLink.isVisible()) {
                        log(eventSender, "(PJE 2) Verificando menu de usuário...", 'Navigation', 'info');
                        await menuLink.click();
                        await delay(800);
                        
                        // Localiza o link específico da Procuradoria
                        const profileLink = await page.evaluateHandle(() => {
                             const anchors = Array.from(document.querySelectorAll("#papeisUsuarioForm\\:dtPerfil a"));
                             return anchors.find(a => {
                                 const t = (a.innerText || "").toUpperCase();
                                 return t.includes("PROCURADORIA") && (t.includes("COELBA") || t.includes("ELETRICIDADE"));
                             });
                        });

                        if (profileLink) {
                             const nomePerfil = await profileLink.evaluate(el => el.innerText);
                             log(eventSender, `(PJE 2) Perfil encontrado: ${nomePerfil}. Trocando...`, 'Navigation', 'info');
                             await profileLink.evaluate(el => el.click());
                             log(eventSender, "Aguardando recarregamento do perfil (PJE 2)...", 'Navigation', 'warn');
                             await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
                             await delay(3000);
                        } else {
                            // Se não achar, apenas fecha o menu ou segue
                            log(eventSender, "(PJE 2) Perfil alvo não encontrado ou já ativo.", 'Navigation', 'info');
                             // Tenta fechar menu
                            await page.keyboard.press('Escape');
                        }
                    }
                } catch (e) { log(eventSender, `(PJE 2) Erro na verificação de perfil: ${e.message}`, 'Navigation', 'warn'); }


                // --- PASSO NOVO: Navegar pelo Menu Principal até o Painel do Advogado ---
                try {
                    log(eventSender, '(PJE 2) Tentando acessar Painel do Representante via Menu...', 'Navigation', 'info');
                    
                    // 1. Clicar no botão "Abrir menu" (Hamburger)
                    // Seletor: a.botao-menu[title="Abrir menu"]
                    const btnMenu = await page.$('a.botao-menu[title="Abrir menu"]');
                    if (btnMenu) {
                        log(eventSender, '(PJE 2) Abrindo Menu Principal...', 'Navigation', 'info');
                        await btnMenu.evaluate(el => el.click());
                        await delay(1000);

                        // 2. Expandir submenu "Painel"
                        // Busca por link que tenha icone desktop e texto Painel
                        const linkPainel = await page.evaluateHandle(() => {
                            // Procura todos os links visíveis no menu
                            const links = Array.from(document.querySelectorAll('ul.ul-menu a'));
                            return links.find(a => a.innerText.includes('Painel') && a.querySelector('.fa-desktop'));
                        });

                        if (linkPainel) {
                            log(eventSender, '(PJE 2) Expandindo submenu Painel...', 'Navigation', 'info');
                            await linkPainel.evaluate(el => el.click());
                            await delay(1000);

                            // 3. Clicar em "Painel do representante processual"
                            // href="/pje/Painel/painel_usuario/advogado.seam"
                            const linkRep = await page.evaluateHandle(() => {
                                const links = Array.from(document.querySelectorAll('ul.ul-menu a'));
                                return links.find(a => 
                                    a.innerText.includes('Painel do representante processual') || 
                                    (a.getAttribute('href') && a.getAttribute('href').includes('advogado.seam'))
                                );
                            });

                            if (linkRep) {
                                log(eventSender, '(PJE 2) Clicando em Painel do Representante..', 'Navigation', 'info');
                                await linkRep.evaluate(el => el.click());
                                log(eventSender, 'Aguardando navegação para o Painel...', 'Navigation', 'warn');
                                await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(e => log(eventSender, "Timeout nav painel (ok se AJAX).", 'warn'));
                                await delay(3000);
                            } else {
                                log(eventSender, '(PJE 2) Link "Painel do representante" não encontrado.', 'Navigation', 'warn');
                            }
                        } else {
                            log(eventSender, '(PJE 2) Submenu "Painel" não encontrado.', 'Navigation', 'warn');
                        }
                    } else {
                        log(eventSender, '(PJE 2) Botão de Menu Principal não encontrado. Tentando seguir...', 'Navigation', 'warn');
                    }

                } catch(e) {
                    log(eventSender, `(PJE 2) Erro na navegação de menu: ${e.message}`, 'Navigation', 'warn');
                }
                // --------------------------------------------------------------------------


                // 2) Aba Expedientes (Idêntico ao PJE 1)
                const tabExp = await page.$('#tabExpedientes_lbl');
                if (tabExp) {
                    // Verifica se já está ativo (active)
                    const classes = await tabExp.getAttribute('class');
                    if (classes && !classes.includes('rich-tab-header-act')) {
                        log(eventSender, '(PJE 2) Clicando aba Expedientes...', 'Navigation', 'info');
                        // Clique JSF nativo
                        await tabExp.evaluate(el => el.click());
                        await delay(4000); // Aguarda AJAX
                    } else {
                        log(eventSender, '(PJE 2) Aba Expedientes já ativa.', 'Navigation', 'info');
                    }
                } else {
                    log(eventSender, '(PJE 2) Aba Expedientes não encontrada pelo ID #tabExpedientes_lbl.', null, 'warn');
                    // Tenta fallback classe
                    const tabExpCls = await page.$('td.rich-tab-header');
                    if(tabExpCls) {
                         const txt = await tabExpCls.innerText();
                         if(txt.includes('Expedientes')) {
                             await tabExpCls.evaluate(el => el.click());
                             await delay(4000);
                         }
                    }
                }

                // 3. Nó Pendentes
                const exactXPath = "//span[contains(@class,'nomeTarefa') and (contains(text(), 'Pendentes de ciência') or contains(text(), 'Pendentes de resposta'))]";
                const clicked = await page.evaluate(async (xp) => {
                    const node = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (node) { node.click(); return true; }
                    return false;
                }, exactXPath);

                if (clicked) {
                    log(eventSender, "(PJE 2) Nó 'Pendentes' clicado.", 'Navigation', 'info');
                    await delay(4000);
                } else {
                    log(eventSender, "(PJE 2) Nó 'Pendentes' não encontrado prontamente.", 'Navigation', 'warn');
                }

            } catch (e) {
                log(eventSender, `(PJE 2) Navegação interna: ${e.message}`, null, 'warn');
            }

            // --- SCAN PJE 2 ---
            // Antes de escanear, verificamos se os nós alvo estão visíveis. Se não, pedimos ajuda ao usuário.
            let scanPje2 = [];
            let retryScan = true;
            
            while(retryScan && !isStopping) {
                scanPje2 = await safeEvaluate(() => {
                    const limparNomeNo = (nomeCompleto) => {
                        let nome = nomeCompleto.toUpperCase().trim();
                        nome = nome.replace(/\s*\(\d+\)/g, '').trim();
                        return nome;
                    };
                    let nosDaArvore = Array.from(document.querySelectorAll(".rich-tree-node-text a"));
                    return nosDaArvore.filter(el => {
                        const nome = el.innerText.trim().toUpperCase();
                        return nome.includes("TRIBUNAL DE JUSTIÇA") || nome.includes("TURMAS RECURSAIS");
                    }).map((el, index) => ({
                        index: index,
                        nomeOriginal: el.innerText.trim(),
                        nomeLimpo: limparNomeNo(el.innerText)
                    }));
                });

                if (scanPje2 && scanPje2.length > 0) {
                    retryScan = false;
                } else {
                    log(eventSender, "PJE 2: Nós 'Tribunal' ou 'Turmas' não encontrados na tela.", null, 'warn');
                    const help = await waitForInput(eventSender, ipcReceiver, 'confirm', {
                        title: 'Ajuda na Navegação (PJE 2)',
                        message: 'O robô não encontrou "Tribunal de Justiça" ou "Turmas Recursais".\n\nPor favor, navegue manualmente na árvore à esquerda até que esses nomes estejam visíveis.\n\nClique em Continuar quando eles aparecerem.',
                        confirmText: 'Continuar (Escanear novamente)',
                        cancelText: 'Pular PJE 2'
                    });
                    if (help === false || help === 'cancel') {
                        retryScan = false;
                        scanPje2 = []; // aborta PJE 2
                    }
                    // se continuar, o loop roda de novo e tenta escanear
                }
            }

            if (scanPje2 && scanPje2.length > 0) {
                log(eventSender, `PJE 2: Encontrados ${scanPje2.length} nós.`, null, 'success');
                const qtd = await waitForInput(eventSender, ipcReceiver, 'number', {
                    title: 'PJE 2 - Quantidade',
                    message: `PJE 2: ${scanPje2.length} nós encontrados (${scanPje2.map(n=>n.nomeLimpo).join(', ')}). Quantos processar?`,
                    max: scanPje2.length
                });
                const limite = parseInt(qtd);
                log(eventSender, `Processando ${limite} nós do PJE 2...`, null, 'info');

                for (let i = 0; i < limite; i++) {
                    const targetName = scanPje2[i].nomeOriginal;
                    log(eventSender, `(PJE 2) Extraindo: ${targetName}...`, null, 'info');

                    const processos = await safeEvaluate(async (targetName) => {
                        const esperar = (ms) => new Promise(res => setTimeout(res, ms));
                        const limparTexto = (t) => t ? t.split('\n').map(l=>l.trim()).filter(l=>l.length>0).join('\n') : "";

                        let elements = Array.from(document.querySelectorAll(".rich-tree-node-text a"));
                        let el = elements.find(e => e.innerText.trim() === targetName);
                        
                        if(!el) return null;
                        
                        el.click();
                        await esperar(3500);

                        let processosDoNo = [];
                        while (true) {
                            let linhasTabela = document.querySelectorAll("table[id$='tbExpedientes'] > tbody > tr");
                            if (linhasTabela.length > 0) {
                                linhasTabela.forEach(linha => {
                                    let celulas = linha.querySelectorAll("td");
                                    if (celulas.length >= 3) {
                                        let colDetalhes = celulas[1].innerText;
                                        let colProcesso = celulas[2].innerText;
                                        let textoCompleto = limparTexto(colDetalhes + "\n" + colProcesso);
                                        if (!processosDoNo.includes(textoCompleto)) processosDoNo.push(textoCompleto);
                                    }
                                });
                            }
                            let botaoAvancar = document.querySelector(".rich-datascr-button[onclick*='fastforward']");
                            if (botaoAvancar && !botaoAvancar.classList.contains('rich-datascr-inact')) {
                                botaoAvancar.click();
                                await esperar(1500);
                            } else {
                                break;
                            }
                        }
                        return processosDoNo;
                    }, targetName);

                    if (processos) {
                        dadosPje2[scanPje2[i].nomeLimpo] = processos;
                        log(eventSender, `   > ${processos.length} expedientes coletados.`, null, 'success');
                    } else {
                        log(eventSender, `   > Falha ao acessar nó.`, null, 'error');
                    }
                }
            } else {
                log(eventSender, "PJE 2: Nenhum nó (Tribunal/Turmas) encontrado na tela atual.", null, 'warn');
            }
        };

        // Run in preferred order: PJE 1 first, then PJE 2 (user preference)
        await runPje1();
        if (isStopping) return;
        await runPje2();
        if (isStopping) return;

        // --- GERAÇÃO DE ARQUIVOS (WORD) ---
        // Combinar dados
        const tudoVazio = Object.keys(dadosPje2).length === 0 && Object.keys(dadosPje1).length === 0;
        
        if (tudoVazio) {
            log(eventSender, "Nenhum dado coletado. Finalizando sem arquivos.", null, 'warn');
        } else {            // Pergunta Merge
            const merge = await waitForInput(eventSender, ipcReceiver, 'select', {
                title: 'Gerar Relatório',
                message: 'Deseja juntar todos os processos (PJE 1 e 2) em um único arquivo Word?',
                options: [
                    { value: 'yes', label: 'Sim, arquivo único unificado' },
                    { value: 'no', label: 'Não, arquivos separados por local' }
                ]
            });

            const outputDir = (args && args.outputDir) ? args.outputDir : path.join(process.cwd(), 'Relatorios_PJE');
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            // Helper Gerador HTML
            const gerarHTML = (tituloH1, processosList) => {
                let html = `<h1 style="font-size:14pt;font-weight:bold;text-transform:uppercase;color:#000;margin-top:20px;margin-bottom:10px;background-color:#f0f0f0;padding:5px;">${tituloH1} (${processosList.length})</h1>`;
                processosList.forEach(p => {
                    html += `<div style="margin-bottom:25px;border-bottom:1px solid #ddd;padding-bottom:10px;"><p>${p.replace(/\n/g, "<br>")}</p></div>`;
                });
                return html;
            };

            const headerHTML = `<html><head><meta charset='utf-8'><title>Relatório PJe</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.2;}</style></head><body>`;
            const footerHTML = "</body></html>";

            if (merge === 'yes') {
                log(eventSender, "Gerando arquivo unificado...", null, 'info');
                let fullContent = headerHTML;
                
                // Add PJE 2
                Object.keys(dadosPje2).forEach(key => {
                    fullContent += gerarHTML(`[PJE 2º Grau] ${key}`, dadosPje2[key]);
                    fullContent += "<br><hr><br>";
                });
                
                // Add PJE 1
                Object.keys(dadosPje1).forEach(key => {
                    fullContent += gerarHTML(`[PJE 1º Grau] ${key}`, dadosPje1[key]);
                    fullContent += "<br><hr><br>";
                });

                fullContent += footerHTML;
                const fPath = path.join(outputDir, `Relatorio_PJE_Unificado_${dayjs().format('DD-MM-YYYY_HHmm')}.doc`);
                fs.writeFileSync(fPath, fullContent, { encoding: 'utf8' }); // utf8 + meta charset handles accents usually, or use \ufeff
                log(eventSender, `Arquivo salvo: ${fPath}`, null, 'success');

            } else {
                log(eventSender, "Gerando arquivos separados...", null, 'info');
                // PJE 2 Separate
                for(const [key, val] of Object.entries(dadosPje2)) {
                    let c = headerHTML + gerarHTML(key, val) + footerHTML;
                    let f = path.join(outputDir, `PJE2_${key.replace(/[^a-z0-9]/gi, '_')}.doc`);
                    fs.writeFileSync(f, c);
                }
                // PJE 1 Separate
                for(const [key, val] of Object.entries(dadosPje1)) {
                    let c = headerHTML + gerarHTML(key, val) + footerHTML;
                    let f = path.join(outputDir, `PJE1_${key.replace(/[^a-z0-9]/gi, '_')}.doc`);
                    fs.writeFileSync(f, c);
                }
                log(eventSender, `Arquivos salvos em: ${outputDir}`, null, 'success');
            }
        }

    } catch (e) {
        log(eventSender, `Erro Fatal: ${e.message}`, e.stack, 'error');
    } finally {
        if (browser) await browser.close();
        log(eventSender, "Fim da execução.", null, 'info');
        eventSender.send('script-finished');
    }
}

module.exports = { runAutomation, stopAutomation, runArchivedAutomation, runPjeAutomation };


