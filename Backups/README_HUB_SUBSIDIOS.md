# Hub de Subsídios Trabalhistas

## Descrição
O **Hub de Subsídios Trabalhistas** era um módulo do **Extratjud** dedicado à gestão de subsídios para trabalhadores, com acompanhamento de processos no **SharePoint** e integração com sistemas de folha de pagamento corporativos. Funcionava como central de processamento e comprovação de benefícios.

## Funcionalidades Principais
- **Formulário de Solicitação** (`formulario_subsidios.html`): Capturas de dados de empregados
- **Validação de Elegibilidade**: Verificação automática de critérios para concessão de subsídio
- **Upload de Documentos**: Integração com SharePoint para armazenamento de evidências
- **Rastreamento de Processo**: Acompanhamento do status da solicitação
- **Integração Bancária**: Dados para processamento de pagamento
- **Relatórios Consolidados**: Extração de dados para auditoria e conformidade
- **Sincronização com SharePoint**: Armazenamento centralizado de documentação

## Estrutura de Dados (Supabase)
O módulo dependia das seguintes tabelas:
- `subsidios_trabalhistas` - Registro de solicitações de subsídio
- `subsidios_documentos` - Documentação comprobatória armazenada
- `subsidios_pagamentos` - Registro de pagamentos processados
- `subsidios_auditoria` - Log de todas as operações

## Arquivos Relacionados
- **Hub Principal**: `hub_subsidios.html`
- **Formulário de Entrada**: `formulario_subsidios.html`
- **Arquivo de Rota**: Acessível via card "Subsídios" no menu principal (removido)
- **Dependências**: Supabase Client, SharePoint API, Integração Bancária

## Razão da Remoção
O módulo foi **desabilitado para simplificação do app** e remover dependência do Supabase. A reformulação focou na essência da automação robótica sem camadas de gestão de banco de dados.

## Possível Reativação Futura
Se necessário reativar este módulo:
1. Restaurar `hub_subsidios.html` e `formulario_subsidios.html` para `public/`
2. Reconfigurar integração Supabase na aplicação principal
3. Reativar card "Subsídios" no `public/index.html`
4. Restaurar integração SharePoint (`sharepoint_service.js`)
5. Executar migrations SQL 001 (schema) e 005 (estrutura adicional)
6. Testar upload e sincronização de documentos

## Migrations SQL Associadas
```sql
-- docs/migrations/001_subsidios_trabalhistas.sql
-- Schema principal da tabela de subsídios

-- docs/migrations/005_add_prioridade_column.sql
-- Extensões de schema
```

## Integração SharePoint
O módulo utilizava `sharepoint_service.js` para:
- Criar pastas automáticas por ID do subsídio
- Sincronizar documentos PDF comprobatórios
- Manter auditoria de alterações
- Garantir segurança de acesso

## Última Auditoria
- Data de Remoção: Abril 2026
- Responsável: Reformulação do Extratjud
- Status: Arquivado em `/Backups/` com documentação completa
- Logs Históricos: Disponíveis em `docs/migrations/`

## Compatibilidade
- **Node.js**: v18+
- **Electron**: v24+
- **Supabase**: RequerTS v2.0+
- **SharePoint**: Integração via APIs REST
