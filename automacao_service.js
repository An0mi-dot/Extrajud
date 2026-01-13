const { chromium } = require('playwright-core'); // Usando core pois Edge já deve estar instalado
const ExcelJS = require('exceljs');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Configurações
const PROJUDI_URL = "https://projudi.tjba.jus.br/projudi/";

// Estado global da automação (para permitir paradas)
let browser = null;
let context = null;
let page = null;
let isStopping = false;

// Utilitários
const log = (eventSender, msg) => {
    console.log(msg);
    if (eventSender) eventSender.send('log-message', msg);
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
    log(eventSender, ">>> INICIANDO AUTOMAÇÃO (NATIVE NODE.JS) <<<");
    log(eventSender, "Configuração: Edge Browser | Modo Scanner | ExcelJS");

    try {
        // 1. Configurar Navegador
        log(eventSender, "Abrindo navegador MS Edge...");
        
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
        log(eventSender, `Acessando ${PROJUDI_URL}...`);
        
        try {
            await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        } catch (navError) {
             log(eventSender, "Erro na conexão inicial. Tentando novamente em 5 segundos...");
             await delay(5000);
             try {
                 await page.goto(PROJUDI_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
             } catch (navError2) {
                 throw new Error(`Falha crítica ao acessar o site: ${navError2.message}. Verifique sua conexão VPN ou Internet.`);
             }
        }

        // --- LOGIN AUTOMÁTICO (Novidade) ---
        if (args && args.user && args.pass) {
            log(eventSender, "Detectadas credenciais. Tentando preenchimento automático...");
            try {
                // Aguarda carregamento inicial de frames
                await delay(2000);
                
        // --- LOGIN AUTOMÁTICO (Novidade - Versão Robusta) ---
        if (args && args.user && args.pass) {
            log(eventSender, "Detectadas credenciais. Iniciando varredura por campos de login...");
            
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
        
        // Voltar Home (Obrigatório para encontrar o menu de Intimações)
        await returnToDashboard(page, eventSender);
        if (isStopping) return;

        // --- FASE 2: INTIMAÇÕES ---
        // Agora ativado e com suporte a filtro!
        // log(eventSender, "!!! Intimações desativadas temporariamente !!!");
        const dfInti = await processCategoryRoutine(page, "Intimações", 'inti', eventSender, inputReceiver, args);
        if (isStopping) return;

        // --- SALVAR EXCEL ---
        await saveToExcel(dfCita, dfInti, eventSender, args);

        log(eventSender, ">>> AUTOMAÇÃO FINALIZADA COM SUCESSO! <<<");
        log(eventSender, "Você pode fechar o navegador se desejar.");

    } catch (error) {
        if (error.message === "STOP_REQUESTED" || isStopping) {
             // Tenta salvar o PDF parcial se houver antes de sair
             log(eventSender, ">>> AUTOMAÇÃO PARADA PELO USUÁRIO <<<");
        } else {
             log(eventSender, `ERRO CRÍTICO: ${error.message}`);
             console.error(error);
             eventSender.send('script-finished', 1);
        }
    } finally {
        // Encerra browser APENAS no final de tudo
        if (browser && isStopping) { // Se parou forçado, fecha. Se sucesso, deixa aberto (opção do user)
             await browser.close();
        }
    }
}

async function stopAutomation(eventSender) {
    isStopping = true;
    log(eventSender, "!!! Solicitada parada da automação !!!");
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
    const outputPath = path.join(process.cwd(), filename);

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
    const pdfPath = path.join(process.cwd(), pdfName);

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
        log(eventSender, `[ERRO] Falha ao gerar PDF de evidências: ${e.message}`);
        console.error(e);
    }
}

module.exports = { runAutomation, stopAutomation };
