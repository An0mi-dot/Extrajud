# 🔍 ANÁLISE PROFUNDA - EXTRATJUD v2.1.7

**Data da Análise:** 11 de Maio de 2026  
**Analista:** GitHub Copilot  
**Status:** Pronto para Limpeza e Reorganização  

---

## 📋 SUMÁRIO EXECUTIVO

Este é um **projeto Electron de automação de portais judiciais** bem estruturado, mas que acumula uma quantidade significativa de:
- ✗ 48+ arquivos desnecessários no root
- ✗ Backups redundantes (pasta `/Backups`)
- ✗ Scripts de testes obsoletos
- ✗ Logs e saídas temporárias
- ✗ Documentação duplicada/fragmentada
- ✗ Arquivos de configuração local

**Objetivo:** Limpar, organizar e consolidar para produção profissional.

---

## 🏗️ ARQUITETURA GERAL

### **Stack Tecnológico**
```
┌─ Frontend
│  ├─ Electron (Desktop Desktop app com Node.js)
│  ├─ HTML5/CSS3 + JavaScript vanilla
│  ├─ Playwright + Cheerio (automação web + scraping)
│  ├─ ExcelJS (geração de planilhas)
│  └─ PDFKit (geração de PDFs)
│
├─ Backend/Dados
│  ├─ Supabase (PostgreSQL + BaaS)
│  ├─ JWT Auth (Supabase Auth)
│  └─ RLS (Row-Level Security com RBAC)
│
└─ Sistemas
   ├─ Windows COM API (Outlook integration)
   ├─ PowerShell (execução de scripts)
   └─ SharePoint API (integração)
```

### **Versão & Distribuição**
- **Versão:** v2.1.7
- **Distribuidor:** NSIS (Windows installer)
- **Repositório:** github.com/An0mi-dot/Extrajud
- **Auto-Update:** Via GitHub releases + electron-updater

---

## 📁 ESTRUTURA ATUAL (ANÁLISE DETALHADA)

### **Pasta Root - 48 arquivos**

#### **✅ ARQUIVOS ESSENCIAIS (MANTER)**
| Arquivo | Propósito | Criticidade |
|---------|----------|-------------|
| `main.js` | Entry point Electron (IPC, tray, updater) | 🔴 CRÍTICO |
| `preload.js` | Segurança IPC (sandbox) | 🔴 CRÍTICO |
| `package.json` | Dependências & scripts | 🔴 CRÍTICO |
| `.gitignore` | Controle de versão | 🟢 Importante |
| `README.md` | Documentação principal | 🟢 Importante |

#### **⚠️ ARQUIVOS DE CONFIGURAÇÃO (ORGANIZAR)**
| Arquivo | Status | Ação |
|---------|--------|------|
| `updates.json` | Metadados de atualização | Mover para `/config` |
| `VERSIONS.md` | Histórico de versões | Mover para `/docs` |

#### **❌ ARQUIVOS INÚTEIS A DELETAR (74 arquivos)**

##### **1. Scripts de Teste/Debug (9 arquivos)**
```
✗ test-electron.js           ← Teste Supabase query (OBSOLETO)
✗ test-electron-insert.js    ← Teste INSERT endpoint (OBSOLETO)
✗ test-db.js                 ← Teste conexão BD (OBSOLETO)
✗ debug_headers.js           ← Debug Excel headers (OBSOLETO)
✗ fix_modals.js              ← Fix UI modais (OBSOLETO)
✗ restore_modals.js          ← Restore modais (OBSOLETO)
✗ repair_subsidios.js        ← Repair tabelas (OBSOLETO)
✗ sharepoint_runner.js       ← Runner SharePoint (PARCIALMENTE USADO)
✗ tests/pje_local_test.js    ← PJE local test (OBSOLETO)
```

##### **2. Scripts Playwright de Testes (4 arquivos)**
```
✗ scripts/test_projudi_2018.js
✗ scripts/test_projudi_filter.js
✗ scripts/test_projudi_hybrid.js
✗ scripts/test_auth.js
```
→ **Razão:** Testavam comportamentos agora integrados em `automacao_service.js`

##### **3. Logs e Saídas Temporárias (7 arquivos)**
```
✗ electron-log.txt          ← Log de execução antiga
✗ electron-test.txt         ← Output de teste antigo
✗ output.txt                ← Saída temporária de teste
✗ output-insert.txt         ← Saída temporária de teste
✗ full-index.txt            ← Index gerado (?)
✗ profile-modal.txt         ← Profile temporário
✗ temp_modal.txt            ← Modal temporário
```

##### **4. Arquivos de Setup Local (4 arquivos)**
```
✗ setup_env.bat             ← Setup Windows batch (obsoleto)
✗ setup_env.ps1             ← Setup PowerShell (obsoleto)
✗ build_ui.ps1              ← Build UI script (obsoleto)
✗ append.py                 ← Script Python auxiliar (obsoleto)
✗ sync.py                   ← Sync script Python (obsoleto)
```
→ **Razão:** Configuração local de desenvolvimento. Use `npm install` e `npm start` em vez disso.

##### **5. Archivos de Runtime Locais (2 arquivos)**
```
✗ pje_last_run.json         ← Cache de última execução
```

##### **6. Backups e Copies (em `/Backups/` - 12 arquivos)**
```
✗ Backups/login.html                          ← Cópia antiga
✗ Backups/hub_subsidios.html                  ← Cópia antiga
✗ Backups/hub_solicitacoes.html               ← Cópia antiga
✗ Backups/formulario_subsidios.html           ← Cópia antiga
✗ Backups/debug.html                          ← Cópia antiga
✗ Backups/README_ADMIN_USERS.md               ← Cópia doc
✗ Backups/README_DATABASE_VIEWER.md           ← Cópia doc
✗ Backups/README_DEBUG.md                     ← Cópia doc
✗ Backups/README_FORMULARIO_SUBSIDIOS.md      ← Cópia doc
✗ Backups/README_HUB_SOLICITACOES.md          ← Cópia doc
✗ Backups/README_HUB_SUBSIDIOS.md             ← Cópia doc
✗ Backups/README_LOGIN.md                     ← Cópia doc
✗ Backups/supabaseClient.js                   ← Cópia arquivo
```
→ **Razão:** Todos já existem em locais corretos (`public/`, `docs/`)

##### **7. Documentação Duplicada/Fragmentada (30+ arquivos)**
```
Em root:
✗ ANALISE_REQUISITOS_E_MELHORIAS.md           ← Duplica informação
✗ COMPLIANCE_REQUISITOS.md                    ← Obsoleta
✗ IMPLEMENTACAO_CONCLUIDA.md                  ← Resumen fragmentado
✗ IMPLEMENTACAO_FUNCIONALIDADES.md            ← Duplica /docs
✗ INDEX_DOCUMENTACAO.md                       ← Index desatualizado
✗ LOGS_MELHORADOS.md                          ← Nota técnica
✗ MANIFESTO_MUDANCAS.md                       ← Changelog desatualizado
✗ RESUMO_EXECUTIVO_SESSAO.md                  ← Nota interna
✗ RESUMO_VISUAL.md                            ← Sumário antigo
✗ ROADMAP_VISUAL_FASE_2.md                    ← Roadmap desatualizado
✗ SOLUCAO_FINAL.md                            ← Resumen antigo
✗ SUMARIO_EXECUTIVO.md                        ← Cópia de RESUMO
✗ TODO.md                                     ← Task list desatualizada
✗ UI_IMPROVEMENTS.md                          ← Nota técnica desatualizada

Em /docs:
✗ CORRECAO_USUARIOS_MENU_CARGOS.md            ← Fix histórico
✗ INVESTIGACAO_PROFUNDA_ADMIN.md              ← Investigação histórica
✗ MIGRACAO_SISTEMA_UUID.md                    ← Migração histórica
✗ PLANEJAMENTO_PJE.md                         ← Planejamento desatualizado
```

##### **8. Configurações Estranhas (5 arquivos)**
```
✗ .continue/agents/new-config.yaml            ← Continue IDE configs (exemplo)
✗ .continue/agents/new-config-1.yaml          ← Continue IDE configs (cópia)
✗ public/assets/theme_bk.css                  ← Backup de theme
✗ public/## Chat Customization Diagnostics.md ← Arquivo gerado pelo VS Code
✗ tools/BACKUP_UI_CRIADOR_PASTAS.html        ← HTML backup comentado
```

##### **9. Outros Arquivos Questionáveis**
```
✗ Relatorios_PJE/                             ← Pasta vazia ou com relatórios desatualizado
✗ Justificativa_Notificacoes_arquivos/        ← Pasta com arquivos Winrar/XML
✗ node_bin/node-v22.12.0-win-x64/            ← Node.js local (10+ GB? - deve remover)
✗ public/Analysis.ipynb                       ← Jupyter notebook estranho
```

---

## 🎯 PROBLEMAS IDENTIFICADOS

### **1. Desorganização Estrutural**
```
├─ Root muito poluído (48 arquivos)
├─ Documentação espalhada em 3+ níveis
├─ Não há separação clara: código/doc/config/test
└─ Histórico de commits/experimentações não limpas
```

### **2. Documentação Fragmentada**
```
┌─ README.md             ← Documento principal
├─ INDEX_DOCUMENTACAO.md ← Index desatualizado
├─ RESUMO_EXECUTIVO_SESSAO.md
├─ SOLUCAO_FINAL.md
├─ 30+ .md no root
└─ /docs/ com mais 40+
  → TOTAL: ~80 arquivos .md desorganizados
```

### **3. Arquivos de Teste Órfãos**
```
✗ 5+ scripts de teste Playwright desatualizado
✗ Debug helpers deixados pelo caminho
✗ Exemplos de teste nunca deletados
```

### **4. Backups Desorganizados**
```
✗ Pasta /Backups/ cria confusão
✗ Duplição de HTML e .md
✗ Sem versionamento (não há controle de quando foram criados)
```

### **5. Configurações de Desenvolvimento Locais**
```
✗ setup_env.bat/.ps1 não mantidas
✗ Encoding quebrado em docs/LEVANTAMENTO_*.html
✗ Cópias de .css deixadas como backup
```

### **6. Dependências Locais Pesadas**
```
✗ node_bin/node-v22.12.0-win-x64/
  → Localizar e remover (10+ GB de espaço)
  → npm install baixa versão correta
```

---

## 🏥 SAÚDE GERAL DO CÓDIGO

### **✅ Pontos Positivos**
1. **Arquitetura modular clara**
   - `main.js` bem organizado com handlers IPC
   - `automacao_service.js` encapsula toda a lógica
   - Separação front (HTML) / back (Node.js)

2. **Segurança implementada**
   - Sandbox Electron (preload.js)
   - RLS policies no Supabase
   - NTLM/Kerberos auth nativo

3. **Funcionalidades robustas**
   - Auto-update via GitHub releases
   - Múltiplos portais (Projudi, PJE)
   - Integração Outlook + SharePoint

4. **Build system funcional**
   - electron-builder configurado
   - NSIS installer
   - Versionamento automático

### **⚠️ Pontos a Melhorar**
1. **Cleanup necessário**
   - 74+ arquivos inúteis
   - Documentação duplicada
   - Backups não controlados

2. **Documentação**
   - README.md poderia ser mais conciso
   - Falta index/guide claro
   - Migração docs para /docs/ nunca completada

3. **Testes**
   - Sem testes automatizados (`npm test` retorna erro)
   - Scripts de teste deixados soltos
   - Sem CI/CD visível (além de auto-bump)

4. **Performance**
   - Node.js local armazenado (remover)
   - Muitos .md diminui performance IDE

---

## 🔧 PLANO DE LIMPEZA E REORGANIZAÇÃO

### **FASE 1: DELETAR (Arquivos Inúteis)**

#### Batch 1: Scripts de Teste & Debug
```bash
❌ test-electron.js
❌ test-electron-insert.js
❌ test-db.js
❌ debug_headers.js
❌ fix_modals.js
❌ restore_modals.js
❌ repair_subsidios.js
```

#### Batch 2: Teste Playwright
```bash
❌ scripts/test_projudi_2018.js
❌ scripts/test_projudi_filter.js
❌ scripts/test_projudi_hybrid.js
❌ scripts/test_auth.js
❌ tests/pje_local_test.js
```

#### Batch 3: Logs & Outputs Temporários
```bash
❌ electron-log.txt
❌ electron-test.txt
❌ output.txt
❌ output-insert.txt
❌ full-index.txt
❌ profile-modal.txt
❌ temp_modal.txt
❌ pje_last_run.json
```

#### Batch 4: Pasta Backups/
```bash
❌ Backups/ (toda a pasta)
```

#### Batch 5: Setup Scripts Locais
```bash
❌ setup_env.bat
❌ setup_env.ps1
❌ build_ui.ps1
❌ append.py
❌ sync.py
```

#### Batch 6: Configurações Obsoletas
```bash
❌ .continue/agents/new-config*.yaml
❌ public/assets/theme_bk.css
❌ public/## Chat Customization Diagnostics.md
❌ tools/BACKUP_UI_CRIADOR_PASTAS.html
```

#### Batch 7: Node.js Local (se existir)
```bash
❌ node_bin/ (todo o diretório)
```

---

### **FASE 2: REORGANIZAR (Documentação)**

#### Consolidar em `/docs/`:
```
docs/
├─ 00-README.md              ← Guia geral (resumido)
├─ 01-ARQUITETURA.md         ← Overview técnico
├─ 02-SETUP.md               ← Instalação & configuração
├─ 03-AUTENTICACAO.md        ← Auth system (já existe)
├─ 04-GUIAS/
│  ├─ admin.md
│  ├─ deploy.md
│  ├─ troubleshooting.md
│  └─ desenvolvimento.md
├─ 05-API_CONTRATOS.md       ← IPC handlers, endpoints
├─ 06-DATABASE.md            ← Estrutura BD
├─ 07-RELEASES/
│  └─ CHANGELOG.md           ← Consolidar histórico
└─ migrations/               ← Já existe (manter)
```

#### Deletar em root:
```bash
❌ Todos os .md exceto:
   ✅ README.md (será reorganizado)
```

---

### **FASE 3: CRIAR (Estrutura Padrão)**

```
EXTRATJUD/
│
├─ .github/                  ← Workflows CI/CD
│  └─ workflows/
│
├─ docs/                     ← Documentação consolidada
│  ├─ 00-README.md
│  ├─ 01-ARQUITETURA.md
│  ├─ 02-SETUP.md
│  ├─ 03-AUTENTICACAO.md
│  ├─ 04-GUIAS/
│  ├─ migrations/
│  └─ screenshots/           ← Imagens de docs
│
├─ src/                      ← Core da automação
│  ├─ automacao_service.js
│  ├─ devtools_*.js
│  ├─ machine_identifier.js
│  └─ sharepoint_service.js
│
├─ scripts/                  ← Build & utility scripts
│  ├─ bump_version.js
│  ├─ generate_icon.js
│  ├─ inspect_*.js
│  └─ serve_pages.js
│
├─ public/                   ← Frontend (manter)
│  ├─ assets/
│  ├─ *.html
│  └─ (sem .txt, .bk, de tudo)
│
├─ tests/                    ← Testes automatizados
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
│
├─ sql/                      ← SQL + migrations
│
├─ config/                   ← Configurações
│  └─ updates.json
│
├─ main.js                   ← Electron entry
├─ preload.js
├─ package.json
├─ package-lock.json
├─ README.md                 ← Referência rápida
├─ .gitignore
├─ .env.example              ← Template de env
└─ CHANGELOG.md              ← Histórico de versões
```

---

## 📊 ESTATÍSTICAS PRÉ-LIMPEZA

| Métrica | Valor |
|---------|-------|
| Arquivos inúteis | ~74 |
| Pasta /Backups | 12 arquivos |
| Documentação duplicada | ~40 arquivos .md |
| Logs/outputs | 7 arquivos |
| Scripts obsoletos | 13 arquivos |
| **Espaço estimado a liberar** | **100 MB - 1 GB** |

---

## ✅ CHECKLIST DE LIMPEZA

- [ ] Deletar scripts de teste obsoletos (13 arquivos)
- [ ] Deletar logs e outputs temporários (7 arquivos)
- [ ] Deletar pasta `/Backups/` (12 arquivos)
- [ ] Deletar setup scripts locais (5 arquivos)
- [ ] Deletar configurações obsoletas (5 arquivos)
- [ ] Remover node_bin/ se existir
- [ ] Consolidar .md em `/docs/`
- [ ] Deletar .md duplicados em root
- [ ] Reorganizar estrutura /src/, /scripts/, /config/
- [ ] Criar estrutura /tests/
- [ ] Criar .env.example
- [ ] Atualizar README.md
- [ ] Atualizar .gitignore
- [ ] Fazer commit de limpeza: "refactor: cleanup workspace and consolidate docs"
- [ ] Tag de release: limpeza concluída

---

## 🚀 RECOMENDAÇÕES PÓS-LIMPEZA

1. **Setup.md**
   ```
   npm install
   npm start          # Dev mode
   npm run dist       # Build
   npm run bump-version  # Bump version
   ```

2. **Contribuir**
   - Contribuidores devem criar branch feature/nome
   - Fazer cleanup antes de PR
   - Sem arquivos de teste soltos

3. **Documentação**
   - Documentação em `/docs/` somente
   - README.md como índice/referência rápida
   - Manter CHANGELOG.md atualizado

4. **CI/CD**
   - Adicionar GitHub Actions workflow
   - Lint + test antes de merge
   - Auto-publish releases

5. **Versionamento**
   - Seguir SemVer
   - Use `npm run bump-version`
   - Tags automáticas no Git

---

**Análise Concluída:** 11/05/2026  
**Próxima Etapa:** Iniciar Fase 1 de Limpeza ⚙️
