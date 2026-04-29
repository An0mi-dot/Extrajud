# README: database-viewer.html (Backup - Removido)

## Propósito Original
**Visualizador/Admin completo do Supabase**:
```
✅ CRUD em user_roles
✅ CRUD em subsidios_trabalhistas  
✅ CRUD em solicitacoes_preventivo
✅ Admin check via user_roles.cargo = 'admin'
```

## Funcionalidades
| Tabela | Permissões | Status |
|--------|------------|--------|
| `user_roles` | Admin | Backup |
| `subsidios_trabalhistas` | Admin | Backup |
| `solicitacoes_preventivo` | Admin | Backup |

## Dependências Removidas
```
supabaseClient.js
Admin RLS policies
```

## Restauração
```
git checkout HEAD -- public/database-viewer.html
```

**Motivo**: Sem Supabase → sem necessidade de DB admin.

