✅ # Correção: Usuários + Menu Gerenciar Cargos

## 🔧 O que foi corrigido

### 1. **Migration SQL (002_user_roles.sql)** ✅
**Erro:** Sintaxe inválida na linha 33 — não pode usar `insert, update` na mesma policy
**Solução:** Separadas em duas policies distintas:
- `Admin pode inserir roles`
- `Admin pode atualizar roles`

**Status:** ✅ Pronto para executar

### 2. **UUIDs Confirmados** ✅
- **Antonio Fernando:** `f259c83d-0a80-432f-b65d-a55b5cfba473`
- **Iane Naira:** `93e01ebc-68aa-45f4-a815-4ea94df3ca40`
- **Já inseridos na migration** (linhas 62-66)

### 3. **Menu "Gerenciar Cargos"** ✅
**Problema:** Só mostrava sua própria conta  
**Causa:** Schema antigo usava `email` e `role`; novo usa `user_email` e `cargo`  
**Solução:** Atualizado `public/index.html` para:
- Buscar todos os usuários via `select('user_email, cargo')`
- Usar `user_email` em todas as queries
- Usar `cargo` em vez de `role`
- Atualizar em vez de upsert (evita erro de chave única)

**Status:** ✅ Pronto para testar

---

## 🚀 PRÓXIMOS PASSOS

### Passo 1: Executar Migration Corrigida
❗ **Importante:** Se já executou a migration antiga, precisa limpar primeiro.

**No Supabase SQL Editor:**

```sql
-- 1. REMOVER tabela antiga (se existir)
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 2. EXECUTAR migration nova
-- Cole TODO o conteúdo de: docs/migrations/002_user_roles.sql
```

**Copie e cole TUDO do arquivo `002_user_roles.sql`** (linhas 1-67)

**Então Execute** (clique play ▶ ou Ctrl+Enter)

### Passo 2: Confirmar Dados Inseridos
Depois da migration executar com sucesso, execute:

```sql
SELECT * FROM user_roles;
```

Deve mostrar:
- Antonio Fernando (f259c83d...) | Responsável Comarca | Salvador
- Iane Naira (93e01ebc...)        | Responsável Comarca | Itabuna

### Passo 3: Testar Menu Gerenciar Cargos
1. **Abra EXTRATJUD**
2. Você deverá ver botão ⚙️ (engrenagem) no canto superior (Admin)
3. Clique nele
4. Deve aparecer caixa "Gerenciar Cargos"
5. **Campo "Email do Usuário"** deve mostrar lista com:
   - antonio.flima@neoenergia.com
   - iane.velame@neoenergia.com

Se listou corretamente → ✅ Funcionando!

### Passo 4: Testar Notificações
1. **Login como Antonio Fernando** (email: antonio.flima@neoenergia.com, senha: Neo426891)
2. Vá para **Hub Subsidios** → Aba **Novo Processo**
3. Preencha:
   - Processo: *qualquer número*
   - Parte: "João Silva"
   - **Comarca: Salvador** ← Importante!
   - Clique **Registrar**
4. **Notificação Windows deve aparecer:**
   - Título: "📋 Novo Subsídio Trabalhista"
   - Mensagem: "João Silva (Salvador)"
   - Ao clicar: abre EXTRATJUD

Repita com **Iane** + **comarca Itabuna** para testar segunda pessoa.

---

## 📁 Arquivos Modificados Esta Sessão

| Arquivo | Mudança |
|---------|---------|
| `002_user_roles.sql` | ✅ Sintaxe SQL corrigida + UUIDs inseridos |
| `public/index.html` | ✅ Menu Gerenciar Cargos atualizado para novo schema |

---

## ⚠️ Troubleshooting

**Q: "ERROR: 42601: syntax error at or near ','..."**  
A: Você está usando a versão ANTIGA da migration. Use a versão CORRIGIDA.

**Q: Botão admin (⚙️) não aparece**  
A: Você precisa ser um "Admin" na tabela user_roles. Edite manualmente no Supabase:
```sql
INSERT INTO user_roles (user_id, user_email, cargo, ativo)
VALUES ('<SEU_UUID>', '<seu-email@empresa.com>', 'Admin', true);
```

**Q: Menu abre mas lista está vazia**  
A: Migration não foi executada. Volte ao Passo 1.

**Q: Notificação não aparece**  
A: Verifique:
1. EXTRATJUD está aberto (não minimizado)
2. Comarca está exatamente "Salvador" ou "Itabuna" (maiúsculas)
3. Usuário logado está correto (antonio.flima... para Salvador)
4. Windows 10+ (Windows 7/8 não suporta notificações nativas)

**Q: Erro "Usuário não encontrado"**
A: Significa que o email digitado não existe em `user_roles`. Crie via:
```sql
INSERT INTO user_roles (user_id, user_email, cargo, comarca, ativo)
VALUES ('<UUID_NOVO_USER>', 'email@empresa.com', 'Responsável Comarca', 'Salvador', true);
```

---

## 📋 Checklist Final

- [ ] Migration 002_user_roles.sql executada com sucesso
- [ ] SELECT * FROM user_roles mostra 2 registros
- [ ] Botão admin (⚙️) visível em EXTRATJUD
- [ ] Menu Gerenciar Cargos abre
- [ ] Lista de usuários (_datalist_) mostra 2 emails
- [ ] Teste notificação Antonio (comarca Salvador) OK
- [ ] Teste notificação Iane (comarca Itabuna) OK
- [ ] Painel mostra distribuição por comarca + responsáveis

---

## 🎯 Status Geral

✅ **Código:** Compilado, sem erros  
✅ **Schema:** Corrigido, sintaxe valid  
✅ **UUIDs:** Confirmados e inseridos  
✅ **Menu:** Atualizado para novo schema  
🟡 **Testes:** Pendentes (executar passos acima)  

**Tudo pronto! Basta executar a migration.** 🚀
