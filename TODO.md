# TODO.md - Reformulação EXTRATJUD (Reset Profissional)

✅ **Backups criados** (Fluxos/Subsídios → pasta Backups com READMEs)  
✅ **index.html reformulado** (só 3 cards: Robôs/Site/Serviços)  
✅ **Supabase removido de index.html** (auth/scripts limpos)  
✅ **Login.html → Backups/**  
✅ **admin_users.html → Backups/**  
✅ **database-viewer.html → Backups/**  
✅ **debug.html → Backups/**  
✅ **supabase/ deletada**  
✅ **supabaseClient.js → Backups/**  

## ⏳ Passos Restantes (Plano Aprovado)

### 1. Remover Login Totalmente (Todo 1/7 ✅)
- ✅ Backup/delete `public/login.html` → Backups/
- ✅ Limpar `hub_servicos.html` (RBAC/Supabase removido)

### 2. Limpar Todos Supabase (Todo 2/7 ✅)
- ✅ Backup/delete: `admin_users.html`, `database-viewer.html`, `debug.html`
- ✅ Backup/delete: pasta `supabase/` completa
- ✅ Backup/delete: `public/assets/supabaseClient.js`

### 3. Manter Core (Todo 3/7 ✅)
- ✅ index.html: só Hub/Site/Serviços
- ✅ Testado `hub_servicos.html` (RBAC removido), `sharepoint_create.html` ✅

### 4. Versions Unificadas (Todo 4/7)
- [ ] Criar `public/VERSIONS.md` (sync GitHub/releases)
- [ ] Update `updates.json` + `scripts/bump_version.js`

### 5. Final Polish (Todos 5-7)
- [ ] Test completo: `npx electron .`
- [ ] Git commit + tag v2.2.0
- [ ] Update site GitHub Pages

**Comando para testar**: `npx electron .` (no root do projeto)

**Progresso**: 5/7 ✅ | Restante: Limpar hub_servicos.html + Versions + Teste!

