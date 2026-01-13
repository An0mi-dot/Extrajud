# Documentação Técnica: Automação Projudi (Citações e Intimações)

## 📌 Visão Geral
Este projeto é uma ferramenta de automação desenvolvida em **Node.js** com interface **Electron**, projetada para operar no sistema **Projudi (TJBA)**. 

O objetivo principal é realizar a varredura automática das listas de **Citações** e **Intimações**, extrair dados processuais para uma planilha Excel formatada e gerar arquivos PDF contendo as "evidências" (prints) das telas visitadas.

### 🎯 Funcionalidades Principais
1. **Login Automático**: Acesso ao portal Projudi TJBA.
2. **Filtro por Período**: Seleção de Data Inicial e Final para a busca.
3. **Extração de Dados**: Captura do NPU, Datas (Postagem, Ciência, Limite) e outros metadados.
4. **Relatório Excel**: Geração de planilha estilizada (.xlsx) sem dependência de modelos externos.
5. **Evidências em PDF**: Geração de um PDF consolidado com o "print" de cada página percorrida, garantindo que o cabeçalho e rodapé da tabela não sejam cortados.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Função no Projeto |
| :--- | :--- |
| **Electron** | Container da Aplicação (Frontend + Backend Node). |
| **Playwright** | Automação do navegador (engine Chromium/Edge). Responsável pela navegação, cliques e screenshots. |
| **Cheerio** | Parser de HTML (jQuery-like). Usado para "ler" o conteúdo da tabela de forma rápida e robusta. |
| **ExcelJS** | Geração e estilização das planilhas Excel. |
| **PDF-Lib / HTML-PDF** | Montagem do PDF final das evidências. |
| **DayJS** | Manipulação e formatação de datas. |

---

## 📂 Estrutura de Arquivos

### `main.js` (Processo Principal)
- Ponto de entrada da aplicação Electron.
- Gerencia a janela principal (`BrowserWindow`).
- Recebe eventos da interface (via IPC `start-automation`) e invoca o serviço de automação.

### `index.html` (Interface do Usuário)
- Interface simples onde o usuário insere credenciais e seleciona o intervalo de datas.
- Contém lógica de JavaScript para envio dos dados ao processo principal.

### `automacao_service.js` (O "Cérebro" do Projeto)
Este é o arquivo mais crítico. Contém toda a lógica de negócio e regras de scraping.

#### Principais Funções:
*   **`runAutomation(args, eventSender)`**: Função `async` principal. Gerencia todo o ciclo de vida: Login -> Navegação Citações -> Extração -> Navegação Intimações -> Extração -> Geração de Arquivos.
*   **`extractTableCustom(html, mode)`**: Recebe o HTML bruto da página e usa o `Cheerio` para parsear as linhas da tabela. Contém lógicas de Regex para limpar dados e normalizar datas.
*   **`saveEvidencePDF(...)`**: Recebe o array de buffers (imagens) e gera o PDF final com layout personalizado (Cabeçalho vermelho, datas, etc).
*   **`saveToExcel(...)`**: Cria a planilha do zero usando `ExcelJS`, aplicando estilos (cores, bordas, fontes) programaticamente.

---

## ⚠️ Pontos Críticos e Lógicas Específicas
Se você for alterar este código, preste atenção nestes detalhes que foram implementados para corrigir bugs específicos do site Projudi:

### 1. Captura de Tela (Screenshots)
O Projudi possui layouts antigos com tabelas aninhadas.
*   **Problema**: Tirar print apenas da `<table>` cortava a última linha. Tirar do `<body>` pegava muita sujeira.
*   **Solução Atual**: O robô localiza o cabeçalho da grade (`tr.subTituloTabela`), encontra a tabela pai e, em seguida, captura o **Container Pai** dessa tabela.
*   **Trecho de código**: Procure por `// --- TABELA DE RESULTADOS (SOLUÇÃO REFINADA v4` no `automacao_service.js`.

### 2. Paginação de Intimações (Bug do Projudi)
*   **Problema**: No Projudi, ao clicar na "Página 2" da lista de Intimações, o filtro de data é perdido (o site reseta para "todos").
*   **Solução**: Antes de clicar em "Próximo", o robô verifica se estamos no modo `inti` e **re-preenche os campos de data** no DOM (`#horarioInicio`, `#horarioFim`) para garantir que a página seguinte respeite o filtro.

### 3. Seletores de Login
O código possui lógica de "retry" e espera explícita para os campos de Login, pois o carregamento do frame de autenticação do TJBA às vezes sofre atrasos.

### 4. Excel Programático
Não usamos um arquivo `.xlsx` modelo na pasta. A planilha é desenhada linha a linha pelo código. Se precisar mudar a cor do cabeçalho de Azul Petróleo para outra cor, edite a função `applyHeaderStyle` dentro de `saveToExcel`.

---

## 🚀 Como Executar
Pré-requisitos: Node.js instalado.

1.  **Instalar dependências**:
    ```bash
    npm install
    ```
2.  **Iniciar aplicação**:
    ```bash
    npm start
    ```

## 🐛 Troubleshooting Comum

*   **Erro "Target closed"**: Geralmente acontece se o usuário fecha o navegador manualmente antes do robô terminar. O código tenta tratar isso no bloco `catch` principal.
*   **Print vazio/cortado**: Verificar se o layout do Projudi mudou. A lógica de captura depende da classe `tr.subTituloTabela`.
*   **Datas incorretas**: O parser de datas (`extractTableCustom`) usa Regex para formatos `DD/MM/YYYY` e formatos por extenso (`21 de Janeiro de...`). Se o site mudar a formatação, o Regex precisará de ajuste.

---
*Documentação gerada em 12/01/2026.*
