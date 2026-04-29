# README: debug.html (Backup - Removido)

## Propósito Original
**Console de Diagnóstico Supabase**:
- Teste de sessão/roles
- Queries em `user_roles` / `subsidios_trabalhistas`
- Admin guard (RLS bypass)
- Contadores e validações

## Uso Típico
```
F5+T → Modo Teste (admin/tester)
Queries manuais para validar RLS
```

## Motivo da Remoção
✅ **Sem Supabase** → debug de DB desnecessário

## Restauração
```
git checkout HEAD -- public/debug.html
```

