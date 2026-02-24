// INSTRUÇÕES:
// 1. Abra o PJE e navegue até a tela que você quer mapear.
// 2. Aperte F12 para abrir o Console do Desenvolvedor.
// 3. Copie todo o código abaixo, cole no Console e aperte Enter.
// 4. O HTML da página será copiado para sua Área de Transferência.
// 5. Crie um arquivo aqui no VS Code (ex: pje_snapshot.html), cole o conteúdo e salve.
// 6. Me avise para eu ler esse arquivo.

(function() {
    console.log("⏳ Gerando Snapshot do HTML...");
    
    // Pega o HTML principal
    let fullHtml = "<!-- SNAPSHOT PRINCIPAL -->\n" + document.documentElement.outerHTML;
    
    // Tenta pegar conteúdo de iframes/frames (comum no PJE)
    const frames = document.querySelectorAll('iframe, frame');
    if (frames.length > 0) {
        console.log(`Encontrados ${frames.length} frames/iframes.`);
        frames.forEach((ifr, i) => {
            try {
                let frameContent = "(Inacessível - cross-origin)";
                if (ifr.contentDocument) {
                    frameContent = ifr.contentDocument.documentElement.outerHTML;
                }
                fullHtml += `\n\n<!-- CONTEÚDO FRAME ${i} (ID: ${ifr.id || 'N/A'}, NAME: ${ifr.name || 'N/A'}) -->\n` + frameContent;
            } catch(e) {
                fullHtml += `\n\n<!-- ERRO LENDO FRAME ${i}: ${e.message} -->`;
            }
        });
    }

    // Método antigo e robusto de copiar
    const dummy = document.createElement("textarea");
    dummy.value = fullHtml;
    document.body.appendChild(dummy);
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    
    console.log("✅ HTML COPIADO COM SUCESSO!");
    console.log("📋 Cole (Ctrl+V) em um arquivo de texto e salve.");
    alert("HTML Copiado! Cole em um arquivo .html ou .txt e salve no projeto para eu analisar.");
})();
