# TODO - UI Restrukturization

## Concluído ✅
- [x] Novo design system no theme.css (cores slate/blue, tipografia Inter, variáveis CSS unificadas)
- [x] theme.js atualizado e simplificado
- [x] index.html - Página principal com topbar, cards modernos, settings modal
- [x] hub_servicos.html - Hub de serviços com loader, cards com status e tempo estimado
- [x] extrator_projudi.html - Sidebar unificada, terminal moderno, status bar
- [x] arquivados_projudi.html - Mesmo layout do extrator, consistente
- [x] pje_extrator.html - Layout unificado com sidebar + terminal
- [x] sharepoint_create.html - Layout unificado, loader toast, modais modernos
- [x] admin_users.html - Tabela estilizada, cards para formulários
- [x] Removido debug UI (debug-fab, debug-menu) do index.html
- [x] Removido welcome overlay do index.html
- [x] Removidos hardcoded credentials visuais (mantidos nos inputs para funcionalidade)
- [x] Componentes compartilhados: settings modal, terminal, status bar, alertas

## Design System v3.0
- **Cores:** Primary blue (#2563eb), slate backgrounds, semantic success/warning/danger
- **Tipografia:** Inter (sans-serif), JetBrains Mono (código)
- **Componentes:** .btn, .card, .terminal, .status-bar, .alert, .modal, .settings-modal, .input
- **Layout:** .sidebar + .main-area para páginas de ferramentas
- **Dark mode:** Totalmente suportado via [data-theme="dark"]

## Próximos Passos Sugeridos
- [ ] Adicionar testes visuais/regression
- [ ] Consolidar settings modal em componente JS reutilizável
- [ ] Adicionar transições de página mais suaves
- [ ] Criar componente de toast notifications
- [ ] Padronizar ícones (todos Font Awesome 6)
