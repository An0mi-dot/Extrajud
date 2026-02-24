// Por algum motivo a porcaria do scritp ta dando um erro com relação as paginas em turmas recursais.
// Inves de pegar todas as paginas, parece que o script começa da pagina 2, e nao da pagina 1.

// No log ele diz que é pagina 1, MAS NAO É. ELE COMEÇA DA PAGINA 2.

// Aqui está o log do erro:
// 244...
// Promise {<pending>}
// VM3990:72       Página 1...
// VM3990:72       Página 2...
// VM3990:72       Página 3...
// VM3990:72       Página 4...
// VM3990:72       Página 5...
// VM3990:72       Página 6...
// VM3990:72       Página 7...
// VM3990:112    ✅ 166 expedientes coletados no total.
// VM3990:61 ⏳ (2/2) Lendo nó: TURMAS RECURSAIS
// 57...
// VM3990:72       Página 1...
// VM3990:112    ✅ 17 expedientes coletados no total.



// Script abaixo: 

(async function () {
    console.clear();
    console.log("%c 🚀 Iniciando Extrator PJe 2º Grau (TJ/TR) - NÓS PRINCIPAIS - FINAL (Corrigido)...", "background: #000; color: #ffeb3b; font-size: 14px; padding: 5px;");

    // --- CONFIGURAÇÕES ---
    const TEMPO_ESPERA_CARREGAMENTO = 3500; // 3.5 segundos por nó principal
    const TEMPO_ESPERA_PAGINACAO = 1000; // 1.0 segundo de espera entre páginas (NOVO)
    
    // --- FUNÇÕES AUXILIARES ---
    const esperar = (ms) => new Promise(res => setTimeout(res, ms));

    const limparTexto = (texto) => {
        if (!texto) return "";
        return texto.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    };

    const limparNomeNo = (nomeCompleto) => {
        let nome = nomeCompleto.toUpperCase().trim();
        // Remove a contagem entre parênteses, ex: 'TRIBUNAL DE JUSTIÇA (123)' vira 'TRIBUNAL DE JUSTIÇA'
        nome = nome.replace(/\s*\(\d+\)/g, '').trim();
        return nome;
    };

    // --- 1. IDENTIFICAÇÃO DOS NÓS ---
    let nosDaArvore = Array.from(document.querySelectorAll(".rich-tree-node-text a"));
    let listaNos = nosDaArvore.filter(el => {
        const nome = el.innerText.trim().toUpperCase();
        return nome.includes("TRIBUNAL DE JUSTIÇA") || nome.includes("TURMAS RECURSAIS");
    }).map(el => ({
        nomeOriginal: el.innerText.trim(),
        nomeLimpo: limparNomeNo(el.innerText),
        elemento: el
    }));

    listaNos.sort((a, b) => a.nomeLimpo.localeCompare(b.nomeLimpo));
    const totalEncontrado = listaNos.length;

    if (totalEncontrado === 0) {
        console.log("%c ❌ Erro: Não encontrei os links 'Tribunal de Justiça' ou 'Turmas Recursais'.", "color: red; font-weight: bold;");
        return;
    }

    let nomesDisponiveis = listaNos.map(n => n.nomeLimpo).join(' e ');
    let inputUsuario = prompt(`Foram encontrados ${totalEncontrado} nós principais: ${nomesDisponiveis}.\n\nQuantos deseja processar? (Digite 1 ou 2)`);

    if (inputUsuario === null) return;
    let limite = parseInt(inputUsuario.trim());
    if (isNaN(limite) || limite <= 0) {
        console.log("%c ❌ Número inválido. Script cancelado.", "color: orange");
        return;
    }
    if (limite > totalEncontrado) limite = totalEncontrado;

    console.log(`%c ▶ Processando ${limite} nó(s)...`, "color: cyan; font-weight: bold;");
    let relatorioFinal = {};

    // --- 3. LOOP DE EXTRAÇÃO (AGORA COM PAGINAÇÃO) ---
    for (let i = 0; i < limite; i++) {
        let noAtual = listaNos[i];
        let nomeNo = noAtual.nomeLimpo;
        console.log(`⏳ (${i + 1}/${limite}) Lendo nó: ${nomeNo}...`);

        try {
            noAtual.elemento.click();
            await esperar(TEMPO_ESPERA_CARREGAMENTO);

            let processosDoNo = [];
            let paginaAtual = 1;

            // --- NOVO: LOOP DE PAGINAÇÃO (mais robusto) ---
            // Tenta localizar o elemento de paginação associado à tabela de expedientes
            const tabelaExp = document.querySelector("table[id$='tbExpedientes']");
            let pager = null;
            if (tabelaExp) {
                const pagers = Array.from(document.querySelectorAll('.rich-datascr'));
                if (pagers.length > 0) {
                    const topoTabela = tabelaExp.getBoundingClientRect().top;
                    pager = pagers.reduce((best, p) => {
                        return Math.abs(p.getBoundingClientRect().top - topoTabela) < Math.abs(best.getBoundingClientRect().top - topoTabela) ? p : best;
                    }, pagers[0]);
                }
            }

            // Helpers: identificar página atual no pager e forçar retorno para a página 1
            const getPagerCurrent = (p) => {
                try {
                    if (!p) return null;
                    const cur = p.querySelector('.rich-datascr-current, .rich-datascr-active, span.rich-datascr-page-current');
                    if (cur && (/^\d+$/.test((cur.innerText||'').trim()))) return parseInt(cur.innerText.trim(), 10);
                    const items = Array.from(p.querySelectorAll('a, span')).filter(e => (/^\d+$/.test((e.innerText||'').trim())));
                    for (const it of items) {
                        if (it.tagName === 'SPAN' || it.classList.contains('rich-datascr-current') || it.classList.contains('rich-datascr-active')) {
                            return parseInt((it.innerText||'').trim(), 10);
                        }
                    }
                    const txt = (p.innerText || '');
                    const m = txt.match(/Página\s*(\d+)/i) || txt.match(/(\d+)\s*de\s*\d+/i) || txt.match(/(\d+)\s*\/\s*\d+/);
                    if (m) return parseInt(m[1], 10);
                } catch (e) { /* ignore */ }
                return null;
            };

            const forceGotoPageOne = async (p) => {
                if (!p) return false;
                const sourceForButtons = (p && typeof p.querySelectorAll === 'function') ? p : document;
                const possiveisFirst = Array.from(sourceForButtons.querySelectorAll('.rich-datascr-button'));
                const firstBtn = possiveisFirst.find(b => (b.getAttribute('onclick') || '').toLowerCase().includes('first') || /«|<<|primeira|inicio/.test(b.innerText));
                if (firstBtn && !firstBtn.classList.contains('rich-datascr-inact')) {
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try { firstBtn.click(); } catch (e) { try { firstBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){} }
                        await esperar(TEMPO_ESPERA_PAGINACAO + attempt * 300);
                        const cur = getPagerCurrent(p);
                        if (cur === 1) return true;
                    }
                }

                // fallback to page number '1' link
                const numOne = Array.from(sourceForButtons.querySelectorAll('a, span')).find(e => (e.innerText || '').trim() === '1');
                if (numOne) {
                    try { numOne.click(); } catch (e) { try { numOne.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){} }
                    await esperar(TEMPO_ESPERA_PAGINACAO);
                    if (getPagerCurrent(p) === 1) return true;
                }

                // fallback: click prev repeatedly
                const prevBtn = Array.from(sourceForButtons.querySelectorAll('.rich-datascr-button, button, a')).find(b => (b.getAttribute('onclick')||'').toLowerCase().includes('prev') || /anteri[oó]r|‹|<|<<|<</.test((b.innerText||'').toLowerCase()));
                if (prevBtn && !prevBtn.classList.contains('rich-datascr-inact')) {
                    for (let iTry = 0; iTry < 8; iTry++) {
                        try { prevBtn.click(); } catch (e) { try { prevBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){} }
                        await esperar(TEMPO_ESPERA_PAGINACAO + iTry * 200);
                        if (getPagerCurrent(p) === 1) return true;
                    }
                }

                return false;
            };

            // Detectar página atual pelo pager (se disponível) e forçar a página 1 quando necessário
            if (pager) {
                const detected = getPagerCurrent(pager);
                if (detected) {
                    paginaAtual = detected;
                    if (paginaAtual !== 1) {
                        console.warn(`   ⚠ Página atual detectada como ${paginaAtual}. Tentando retornar para a página 1...`);
                        const ok = await forceGotoPageOne(pager);
                        if (ok) {
                            paginaAtual = getPagerCurrent(pager) || 1;
                            console.log(`   ✅ Retornou para a página ${paginaAtual}.`);
                        } else {
                            console.warn('   ⚠ Não foi possível forçar página 1 via pager. Prosseguindo a partir da página detectada.');
                        }
                    }
                } else {
                    // sem detecção, tenta forçar de qualquer forma
                    await forceGotoPageOne(pager);
                }
            } else {
                // sem pager conhecido, nada a fazer
            }

            while (true) {
                console.log(`      Página ${paginaAtual}...`);

                // 1. Coleta os processos da página atual
                let linhasTabela = document.querySelectorAll("table[id$='tbExpedientes'] > tbody > tr");

                if (linhasTabela.length > 0) {
                    linhasTabela.forEach(linha => {
                        let celulas = linha.querySelectorAll("td");
                        if (celulas.length >= 3) {
                            let colDetalhes = celulas[1].innerText;
                            let colProcesso = celulas[2].innerText;
                            let textoCompleto = limparTexto(colDetalhes + "\n" + colProcesso);
                            if (!processosDoNo.includes(textoCompleto)) {
                                processosDoNo.push(textoCompleto);
                            }
                        }
                    });
                }

                // 2. Localiza o botão "próxima" relativo ao pager identificado (ou fallback global)
                let botaoAvancar = null;
                if (pager) {
                    const sourceForButtons = (typeof pager.querySelector === 'function') ? pager : document;
                    botaoAvancar = sourceForButtons.querySelector(".rich-datascr-button[onclick*='next']")
                        || sourceForButtons.querySelector(".rich-datascr-button[onclick*='step']")
                        || Array.from(sourceForButtons.querySelectorAll('.rich-datascr-button')).find(b => /pr[oó]xima|>|\u00187/.test((b.innerText || '').toLowerCase()) || (b.getAttribute('onclick')||'').toLowerCase().includes('next'));
                }
                if (!botaoAvancar) {
                    botaoAvancar = document.querySelector(".rich-datascr-button[onclick*='next']") || document.querySelector(".rich-datascr-button[onclick*='step']") || document.querySelector(".rich-datascr-button[onclick*='fastforward']");
                }

                if (botaoAvancar && !botaoAvancar.classList.contains('rich-datascr-inact')) {
                    botaoAvancar.click();
                    await esperar(TEMPO_ESPERA_PAGINACAO);
                    paginaAtual++;
                } else {
                    break;
                }
            }
            // --- FIM DO LOOP DE PAGINAÇÃO ---

            if (processosDoNo.length > 0) {
                relatorioFinal[nomeNo] = processosDoNo;
                console.log(`   ✅ ${processosDoNo.length} expedientes coletados no total.`);
            } else {
                console.log(`   ⚠ Nenhum expediente encontrado.`);
            }

        } catch (erro) {
            console.error(`❌ Erro em ${nomeNo}:`, erro);
        }
    }

    // --- Pergunta sobre juntar ou separar ---
    let escolha = prompt("Deseja juntar TJ e TR em um único arquivo Word?\nDigite:\n1 - Sim, juntar tudo\n2 - Não, gerar separados");
    if (escolha === null) return;
    escolha = parseInt(escolha.trim());

    const gerarDocumentoWord = (nomeNo, processos) => {
        const classificacao = nomeNo.includes("TRIBUNAL") ? 'TJ' : 'TR';
        const contagemProcessos = processos.length;
        const tituloFormatado = `${nomeNo} (${contagemProcessos})`;

        let conteudoHTML = `
            <h1 style="font-size:14pt;font-weight:bold;text-transform:uppercase;color:#000;margin-top:20px;margin-bottom:10px;background-color:${classificacao === 'TJ' ? '#e8eaf6' : '#fff3e0'};padding:5px;">
                ${tituloFormatado}
            </h1>
        `;

        processos.forEach(textoProcesso => {
            let htmlProcesso = textoProcesso.replace(/\n/g, "<br>");
            conteudoHTML += `<div style="margin-bottom:25px;border-bottom:1px solid #ddd;padding-bottom:10px;"><p>${htmlProcesso}</p></div>`;
        });

        return conteudoHTML;
    };

    if (escolha === 1) {
        // Juntar tudo em um único arquivo
        console.log("💾 Gerando arquivo único...");
        let conteudoHTML = `
            <html><head><meta charset='utf-8'><title>Relatório PJe Unificado</title>
            <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.2;}</style></head><body>
        `;
        Object.keys(relatorioFinal).forEach(nomeNo => {
            // Adiciona uma quebra de página se não for o primeiro nó
            let quebraPagina = Object.keys(relatorioFinal).indexOf(nomeNo) > 0 ? `<div style="page-break-before: always;"></div>` : '';
            conteudoHTML += quebraPagina;
            conteudoHTML += gerarDocumentoWord(nomeNo, relatorioFinal[nomeNo]);
        });
        conteudoHTML += "</body></html>";

        const blob = new Blob(['\ufeff', conteudoHTML], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Relatorio_PJE2_(DATA).doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("%c ✅ Documento único gerado com sucesso!", "color: #4CAF50; font-weight: bold;");
    } else {
        // Gerar separados
        console.log("💾 Gerando arquivos separados...");
        Object.keys(relatorioFinal).forEach(nomeNo => {
            let conteudoHTML = `
                <html><head><meta charset='utf-8'><title>Relatório PJe ${nomeNo}</title>
                <style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.2;}</style></head><body>
            `;
            conteudoHTML += gerarDocumentoWord(nomeNo, relatorioFinal[nomeNo]);
            conteudoHTML += "</body></html>";

            const blob = new Blob(['\ufeff', conteudoHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Relatorio_PJE_${nomeNo.replace(/\s+/g, "_")}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log(`✅ Documento ${nomeNo} gerado com sucesso.`);
        });
    }

    console.log("\n%c 🏁 Processo finalizado. Verifique seus downloads.", "background: green; color: white; font-size: 16px; padding: 5px;");
})();
