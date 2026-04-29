# README: login.html (Backup - Removido)

## Propósito Original
Página de autenticação usando **Supabase Auth**. Suportava:
- Login com email/senha
- Cadastro de novos usuários
- Login "visitante" (auto-cadastro temporário)
- Rate limiting client-side
- Backup de sessão para "troca de conta"

## Motivo da Remoção
- **Reformulação 2026**: App agora roda **sem login** (instância independente)
- Todos os usuários têm acesso total aos 3 módulos principais
- Fluxo simplificado: abre direto no `index.html` com 3 cards

## Status da Migração
✅ **Migrações aplicadas**:
- `index.html` já abre direto (sem redirecionar para login)
- `main.js` carrega `index.html` sem verificar auth
- Comentado/desabilitado todo código de auth no `index.html`

## Como Restaurar (se necessário)
```
git checkout HEAD -- public/login.html
git checkout HEAD -- public/assets/supabaseClient.js
# Re-aplicar migrações Supabase
```

**Versão do backup**: 2.1.2 (pré-reset)

