(function() {
    console.clear();
    console.log("%c 🎥 GRAVADOR DE NAVEGAÇÃO PJE INICIADO", "background: #000; color: #0f0; font-size: 16px; font-weight: bold; padding: 4px;");
    console.log("%c 1. Navegue normalmente clicando nos menus.", "color: #ccc");
    console.log("%c 2. Quando chegar na tela desejada, digite %cparar()%c no console e pressione Enter.", "color: #ccc", "color: #ff0; font-weight:bold;", "color:#ccc");

    window._historicoCliques = [];

    // Função para gerar um XPATH ou Seletor útil para o robô
    function getIdentificador(el) {
        if (!el) return null;
        const text = el.innerText ? el.innerText.trim() : '';
        
        // Padrão PJE: SPAN com classe nomeTarefa (Menu lateral)
        if (el.tagName === 'SPAN' && el.classList.contains('nomeTarefa')) {
            return `//span[contains(@class, 'nomeTarefa') and normalize-space(text())="${text}"]`;
        }
        
        // Abas ou Cabeçalhos de Tabela (Expedientes)
        if (el.tagName === 'TD' && (el.classList.contains('rich-tab-header') || el.classList.contains('abaExpediendes'))) {
             return `//td[contains(@class, 'rich-tab-header') and contains(text(), '${text}')]`;
        }

        // Links ou Botões com texto
        if ((el.tagName === 'A' || el.tagName === 'BUTTON') && text) {
             return `//${el.tagName.toLowerCase()}[normalize-space(text())="${text}"]`;
        }

        // Fallback: ID (se não parecer gerado automaticamente com muitos números)
        if (el.id && !/\d{5,}/.test(el.id)) return `#${el.id}`;
        
        // Fallback genérico
        return `${el.tagName} (Text: ${text.substring(0,30)}...)`;
    }

    // Handler global de clicks
    function capturarClique(e) {
        if (!e.isTrusted) return; // Ignora cliques simulados por script

        // Procura o elemento "interativo" mais próximo do clique (para não pegar um <i> ou <span> solto dentro de um botão)
        let alvo = e.target.closest('a, button, span.nomeTarefa, td.rich-tab-header, .rich-tree-node') || e.target;
        
        let passo = {
            elemento: alvo.tagName,
            texto: alvo.innerText ? alvo.innerText.trim().replace(/\s+/g, ' ') : '',
            sugestao_xpath: getIdentificador(alvo),
            classes: alvo.className,
            id: alvo.id || null
        };

        window._historicoCliques.push(passo);
        console.log(`%c 🖱️ CLIQUE REGISTRADO [${window._historicoCliques.length}]: ${passo.texto || passo.elemento}`, "color: yellow; font-weight: bold;");
        console.log(passo.sugestao_xpath);
    }

    document.addEventListener('click', capturarClique, true);

    // Função para encerrar e exportar
    window.parar = function() {
        document.removeEventListener('click', capturarClique, true);
        console.log("%c ⏹️ GRAVAÇÃO FINALIZADA!", "background: #b91c1c; color: #fff; font-size: 16px; font-weight: bold; padding: 4px;");
        console.log("Copie o JSON abaixo e envie para o desenvolvedor:");
        console.log(JSON.stringify(window._historicoCliques, null, 2));
        return "Histórico gerado. Veja acima.";
    };
})();
