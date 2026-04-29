# README: supabaseClient.js (Backup - Removido)

## Cliente Supabase Original
```js
// URL: https://lvicpvodestuhptsaqba.supabase.co
// Key: sb_publishable_swkWnnSxhlJfFKtUfBt4TQ_Yj1fbYd1 (PUBLIC)
// Config: auth persistSession=false (stateless)
```
**Integração**: Usava `net.fetch` do Electron (NTLM proxy support).

## Uso em Páginas
```
login.html (Auth)
admin_users.html (Users CRUD)
database-viewer.html (Tables CRUD)
debug.html (Queries)
hub_servicos.html (RBAC)
```

## Motivo da Remoção
✅ **Sem Supabase** → cliente desnecessário

## Restauração
```
git checkout HEAD -- public/assets/supabaseClient.js
```

