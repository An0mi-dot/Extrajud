# Guia de Troubleshooting - Permissões e Dados

## Problema 1: Botão "Gerenciar Cargos" não aparece

**Sintomas:**
- Você executou o comando SQL para ser admin
- Mas o botão ainda não aparece na interface

**Causa Raiz:**
O código JavaScript estava lendo `data.role` quando o campo se chama `data.cargo`.

**Solução:**
✅ **CORRIGIDO** - Atualizei o código para ler `data.cargo` corretamente.

**Verificar:**
1. Abra `Debug Console` no menu inicial (novo card com ícone de bug)
2. Clique em **"Carregar Cargo"**
3. Verifique se seu cargo aparece como "admin"

---

## Problema 2: Processos não aparecem em Subsídios

**Investigação em 3 passos:**

### Passo 1: Verificar Sessão
```
Debug Console → Carregar Sessão
```
Verifique se seu email aparece corretamente.

### Passo 2: Contar Registros
```
Debug Console → Tabela subsidios_trabalhistas → Contar Registros
```
Se retorna "Total de registros: 0", significa:
- A tabela foi criada mas está vazia, OU
- A tabela não existe

### Passo 3: Se tabela não existe
Execute no **Supabase SQL Editor**:
```sql
-- Copie todo o conteúdo de:
docs/migrations/001_subsidios_trabalhistas.sql
-- Cole no SQL Editor do Supabase e execute
```

### Passo 4: Se tabela existe mas está vazia
- Vá para `hub_subsidios.html`
- Insira novos processos manualmente
- Se funciona, ótimo! Se dá erro, anote a mensagem

---

## Problema 3: Solicitações não carregam

**Ainda falta criar a tabela!**

Você não executou o script 003 ainda. Execute:

```sql
-- Copie todo o conteúdo de:
docs/migrations/003_solicitacoes_preventivo.sql
-- Cole no SQL Editor do Supabase e execute
```

Depois teste com `Debug Console → Tabela solicitacoes_preventivo`.

---

## Problema 4: Erro "policies don't grant you..."

**Causa:** RLS Policy está bloqueando seu acesso

**Verificação:**
```
Debug Console → RLS Policies → Verificar RLS
```

**Solução:**
Se as policies estão muito restritivas, execute:

```sql
-- Desabilitar RLS temporariamente para testes:
ALTER TABLE subsidios_trabalhistas DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_preventivo DISABLE ROW LEVEL SECURITY;

-- Depois que funcionar, reabilitar:
ALTER TABLE subsidios_trabalhistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_preventivo ENABLE ROW LEVEL SECURITY;
```

---

## Debug Console - Quais botões usar?

| Botão | Utilidade |
|-------|-----------|
| **Carregar Sessão** | Ver se você está autenticado |
| **Carregar Cargo** | Ver seu cargo (admin/tester/etc) |
| **Carregar Processos** | Ver se consegue ler subsidios_trabalhistas |
| **Contar Registros** | Ver quantos processos existem |
| **Ver Todos os Cargos** | Ver quem tem qual cargo |
| **Ver Meu Cargo** | Igual a "Carregar Cargo" |
| **Verificar RLS** | Ver informações sobre políticas de segurança |

---

## Checklist Final

Após corrigir os problemas:

- [ ] Debug Console mostra seu email e user_id
- [ ] Debug Console mostra seu cargo como "admin"
- [ ] Botão "Gerenciar Cargos" aparece em hub_subsidios
- [ ] Você consegue inserir um novo processo em hub_subsidios
- [ ] Processos aparecem na tabela de http_subsidios
- [ ] http_solicitacoes carrega (após executar migration 003)
- [ ] Você consegue inserir solicitações em hub_solicitacoes

---

## Próximas ações:

1. **Hoje:** Execute `DEBUG_QUERIES.sql` no Supabase para ver o estado real dos dados
2. **Hoje:** Use o Debug Console para diagnosticar problemas
3. **Hoje:** Execute os scripts SQL de migration conforme necessário
4. **Amanhã:** Se ainda houver problemas, compartilhe os outputs do Debug Console

---

## Links úteis:

- **Debug Console:** `public/debug.html` (novo)
- **Migration 001:** `docs/migrations/001_subsidios_trabalhistas.sql` (já deve estar ok)
- **Migration 003:** `docs/migrations/003_solicitacoes_preventivo.sql` (falta executar)
- **Script de Admin:** `docs/migrations/ADD_ADMIN_USER.sql` (já executado?)
- **Queries de Debug:** `docs/migrations/DEBUG_QUERIES.sql` (novo)

