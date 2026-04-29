# README: admin_users.html (Backup - Removido)

## Propósito Original
Painel administrativo completo para **gerenciar usuários Supabase**:
- Listagem de usuários com `v_users_with_roles`
- Reatribuição de UUID (máquina → usuário)
- Edição de apelidos/nomes
- Ativação/desativação de contas
- Busca por UUID/Machine ID

## Dependências Removidas
```
supabaseClient.js
Tabelas: v_users_with_roles, users_auto
RPC: update_user_uuid_manual
```

## Motivo da Remoção
✅ **Sem Supabase/Auth** → sem necessidade de admin de usuários

## Restauração
```
git checkout HEAD -- public/admin_users.html
# Re-aplicar views/RPC no Supabase
```

