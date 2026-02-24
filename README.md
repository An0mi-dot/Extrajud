# Extrajud — Automação Projudi (Citações / Intimações)

**Última atualização:** 2026-02-24

Este repositório contém uma aplicação desktop (Electron) que automatiza a extração de dados em portais judiciais (p.ex. Projudi), gera planilhas Excel com os dados encontrados e cria PDFs com evidências (screenshots) das páginas visitadas.

---

### Novidades Recentes (v1.2.8+)
- **Padronização Visual**: Seção "Sobre" sincronizada em todas as páginas do aplicativo (`index.html`, `extrator_projudi.html`, `arquivados_projudi.html`, `pje_extrator.html`).
- **Correções de UI**:
  - Ajuste no motor de temas (`theme.js`) para garantir consistência em processos arquivados.
  - Correção do overlay do modal de configurações (Stacking Context) garantindo sobreposição total da página.
- **Log de Versão**: Exibição dinâmica da versão do app e ambiente diretamente no modal Sobre.

---

## Sumário

- Visão geral
- Requisitos
- Estrutura do projeto e descrição de arquivos
- IPC e contratos entre `renderer` e `main`
- Auto-Update e workflow de Release
- Modal "Solicitar Serviço" (envio de e-mail)
- Execução e empacotamento
- Testes e scaffold local
- Git LFS, CI (auto-bump) e publicação
- Troubleshooting e dicas de manutenção

---

## Visão geral

Funcionalidade principal: automatizar navegação em portais judiciais (login, filtros de período, paginação), extrair dados tabulares relevantes (NPU, datas, descrição), gerar saída legível (Excel) e produzir PDFs com as telas capturadas como evidência.

Arquitetura resumida:

- Processo principal (`main.js`): gerencia janela, IPC e integração com SO (abrir links, criar e-mails via Outlook COM). Também abriga utilitários de rede (fetch com retries) e persistência de configuração (`state.json`).
- Renderer (`index.html` e páginas auxiliares): UI, modais e controles que disparam automações via IPC.
- Serviço de automação (`automacao_service.js`): core das automações (Playwright/Cheerio/ExcelJS/PDF generation).

---

## Requisitos

- Node.js 18+ (recomendado)
- npm 9+
- Windows é o ambiente mais testado (integração Outlook via COM), porém o app roda em macOS/Linux com funcionalidades limitadas.

Instalação:

```bash
npm install
```

Execução (dev):

```bash
npm start
```

---

## Estrutura do projeto e descrição dos arquivos importantes

- `main.js` — processo principal
  - Cria a `BrowserWindow` e carrega `index.html`.
  - Persistência: grava `state.json` em `app.getPath('userData')`.
  - `fetchJson(url, timeout, retries)`: utilitário robusto para buscar metadados (atualizações).
  - IPC handlers: atualização, abrir links, criar e-mail Outlook (PowerShell+COM), execução/paro de automações.

- `index.html` — UI principal
  - Contém modais: Tema (Dark Mode), Atualizações, Solicitar Serviço, Sobre.
  - Interage com `main` via `ipcRenderer.invoke/send` para iniciar automações e checar updates.

- `automacao_service.js` — automação (Playwright + Cheerio)
  - `runAutomation`, `runArchivedAutomation`, `runPjeAutomation` e `stopAutomation`.
  - `extractTableCustom(html, mode)`: parse robusto com Cheerio e regex para normalizar datas e campos.
  - `saveToExcel(...)` (ExcelJS) e `saveEvidencePDF(...)` (PDF generation).

- `externas/pje-problema/script_pje_problema.js` — heurísticas específicas para PJE (menus, retries, fallback selectors).
- `externas/pje-problema/script_pje2_problema.js` — scripts auxiliares e testes para PJE (menos prioritários).

- `pje_extrator.html`, `extrator_projudi.html`, `arquivados_projudi.html` — UIs / logs por extrator.

- `updates.json` — metadados de update (padrão do checker). Exemplo raw: https://raw.githubusercontent.com/An0mi-dot/Extrajud/main/updates.json

- `assets/` — imagens, logo e recursos estáticos.

---

## IPC: contratos e uso (resumo)

Handlers expostos pelo `main` (use `ipcRenderer.invoke` para handles e `ipcRenderer.send` para eventos):

- `load-app-state` (handle): retorna estado salvo.
- `save-app-state` (send): salva estado.
- `get-app-version` (handle).
- `get-update-config` / `set-update-config` (handles): ler/gravar `updateServer` e `autoUpdate`.
- `check-for-updates` (handle): busca JSON remoto e compara versão.
- `perform-update` (send): abre link de download.
- `open-external` (handle): wrapper de `shell.openExternal()` com fallback para `mailto:` no Windows.
- `create-outlook-mail-html` (handle): abre rascunho no Outlook com `HTMLBody` (Windows).
- `run-script`, `run-archived-script`, `run-pje-script` (on): iniciam automações.
- `stop-script` (on): solicita parada.
- `send-input`, `pje-input-response` (on): canais para comunicação de inputs do usuário.
- `dialog:openDirectory` (handle): abre diálogo de seleção de pasta.

Se alterar qualquer nome aqui, atualize todos os `ipcRenderer.*` nos renderers.

---

## Update-checker e `updates.json`

Fluxo:

1. O usuário pode configurar um `updateServer` (URL para JSON) no modal de atualização na UI.
2. O `main` usa `fetchJson` para obter o JSON e compara `version` (ou `tag_name`) com `package.json` local.
3. Se houver versão mais nova, a UI exibe changelog e permite abrir o `meta.url`.

Formato recomendado (`updates.json`):

```json
{
  "version": "1.0.1",
  "url": "https://github.com/OWNER/REPO/releases/tag/v1.0.1",
  "notes": "Notas de versão...",
  "published_at": "2026-01-20T00:00:00Z"
}
```

Nota: o repositório contém um `updates.json` exemplo em https://raw.githubusercontent.com/An0mi-dot/Extrajud/main/updates.json

Se der `timeout` na checagem, verifique rede/proxy/firewall e se a URL é acessível no host onde o app roda.

---

## Modal "Solicitar Serviço" e envio de e-mail

- O modal gera um HTML de e-mail com o logo (quando encontrado) embutido em Base64.
- Tenta criar um rascunho no Outlook (Windows) via PowerShell+COM. Se falhar, tenta `shell.openExternal('mailto:...')` com fallback de `cmd /c start` no Windows.

Pontos a conferir:

- Se der erro no compose do Outlook, veja o log do `main` no terminal que executa `npm start`.

---

## Execução, empacotamento e distribuição

Executar localmente:

```bash
npm install
npm start
```

Empacotamento recomendado (exemplos):

- Com `electron-builder`: configure `build` em `package.json` e rode `npx electron-builder --win --x64`.
- Com `electron-packager`: `npx electron-packager . --platform=win32 --arch=x64 --out=dist`.

Para atualizações automáticas (produto em produção), considere usar `electron-updater` e um servidor de artefatos que hospede instaladores compatíveis com o seu método de update.

---

## Testes e scaffold local

- O repositório inclui um scaffold para testes baseados em Playwright (`tests/`). Instale os browsers se necessário:

```bash
npx playwright install
```

- Execute testes de Playwright via script (se disponível):

```bash
npm run test:playwright
```

Posso ajudar a criar um workflow de CI (GitHub Actions) que rode esses testes em PRs.

---

## Git LFS, CI e automações (observações)

- Para arquivos pesados use Git LFS. Há helpers em `scripts/` e instruções anteriores neste README.
- Há um workflow de auto-bump no `.github/workflows/` — revise as regras antes de confiar nele em produção.

**Nota:** a partir de 2026-01-21 este repositório documenta **apenas** as versões do *aplicativo* em `VERSIONS.md`. O versionamento por serviço (ex.: `services.json` e scripts de bump por serviço) foi removido para simplificar o histórico — use `npm run bump-version` para registrar releases do app.

## Versionamento do App 🔖

- Comando: `npm run bump-version` (ou `node scripts/bump_version.js`).
- O que faz: incrementa a versão do app (patch++), atualiza `package.json`, atualiza `updates.json` (quando presente) e adiciona uma entrada em `VERSIONS.md` com commit/short SHA.
- Comportamento seguro: por padrão o script só realiza o bump quando detecta alterações relevantes desde o último release (ignore apenas `VERSIONS.md` e `updates.json`). Use `--force` ou `FORCE_BUMP=1` para forçar.
- Novo: `--dry-run` (ou `DRY_RUN=1`) mostra **o que** seria alterado sem gravar ou commitar nada. Exemplo:

```bash
npm run bump-version -- --dry-run
```

Saída esperada (resumida):

- Current version: `1.0.2`
- Proposed new version: `1.0.3`
- Files that would change: `package.json`, `updates.json` (if exists), `VERSIONS.md`
- Proposed commit message: `chore(release): v1.0.3`
- VERSIONS.md entry preview:

```
## v1.0.3 - 2026-01-21

- Commit: <short-sha>
- Notes: <commit message>
```



---

## Troubleshooting e dicas de manutenção

- Timeout no `check-for-updates`: verifique URL, proxy e alcance da rede; abra o raw JSON no navegador a partir da máquina que executa o app.
- Páginas em branco ou ReferenceError: abra DevTools (renderer) e veja console; verifique se `contextIsolation` e `nodeIntegration` são apropriados para suas mudanças de segurança.
- Falha ao abrir Outlook: confirme instalação/configuração Outlook desktop.

Logs úteis: terminal que iniciou o Electron (onde `npm start` roda) e console da DevTools do renderer.

---

## Contribuições e próximos passos sugeridos

- Padronizar seletores dos extratores e documentar cada seletor (arquivo CHANGELOG ou docs/).
- Adicionar testes Playwright end-to-end para fluxos críticos (login, extração, geração de arquivos).
- Publicar `updates.json` em URL estável (GitHub Pages, S3 ou CDN) e apontar a configuração padrão do app para esse endpoint.

Se desejar, eu posso:

- criar o workflow de publicação do `updates.json` (ex.: GitHub Pages) e atualizar o `package.json`;
- adicionar o CI que roda os testes Playwright;
- criar um instalador e publicar um release automático.

---

Arquivo `updates.json` (raw): https://raw.githubusercontent.com/An0mi-dot/Extrajud/main/updates.json
