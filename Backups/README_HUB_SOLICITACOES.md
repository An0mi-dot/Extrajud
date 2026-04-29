# Hub de Solicitações (Fluxo de Demandas)

## Descrição
O **Hub de Solicitações** foi um módulo integrado ao **Extratjud** que gerenciava o fluxo de demandas jurídicas, ofícios e solicitações internas. Ele funcionava como uma central de gestão para rastrear, priorizar e acompanhar todas as requisições processadas pela área jurídica.

## Funcionalidades Principais
- **Criação de Solicitações**: Formulário para abertura de novas demandas
- **Rastreamento de Status**: Acompanhamento em tempo real do estado de cada solicitação
- **Atribuição de Responsáveis**: Designação automática ou manual de responsáveis por comarca
- **Filtros e Pesquisa**: Busca avançada por tipo, data, status e responsável
- **Notificações**: Alertas via integração (Teams/Email) sobre mudanças de status
- **Relatórios**: Geração de relatórios gerenciais sobre demandas processadas

## Estrutura de Dados (Supabase)
O módulo dependia das seguintes tabelas:
- `solicitacoes` - Registro de todas as solicitações
- `solicitacao_tarefas` - Subtarefas de cada solicitação
- `comarca_responsaveis` - Mapeamento de comarcas para responsáveis
- `user_roles` - Permissões e papéis dos usuários

## Arquivos Relacionados
- **Arquivo Principal**: `hub_solicitacoes.html`
- **Arquivo de Rota**: Acessível via card "Fluxo" no menu principal (removido)
- **Dependências**: Supabase Client (`supabaseClient.js`), Electron IPC

## Razão da Remoção
O módulo foi **desabilitado para simplificação do app** e remover a dependência total do Supabase. A aplicação foi reformulada para focar em funcionalidades de automação robótica (RPA) independentes de banco de dados corporativo.

## Possível Reativação Futura
Se houver necessidade de reativar este módulo, será necessário:
1. Restaurar o arquivo `hub_solicitacoes.html` para a pasta `public/`
2. Reconfigurar integração com Supabase na aplicação principal
3. Reativar o card "Fluxo" no `public/index.html`
4. Executar as migrações SQL referentes (migration 003)
5. Testar integração com Teams para notificações

## Migration SQL Associada
```sql
-- docs/migrations/003_solicitacoes_preventivo.sql
-- Contém schema e funções de gestão de solicitações
```

## Últimas Alterações
- Data de Remoção: Abril 2026
- Motivo: Reformulação para app independente sem autenticação
- Backup: Arquivos preservados em `/Backups/`
