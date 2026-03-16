# Investigação Profunda: Por que o Admin não funciona?

## Status Atual

✅ **CORRIGIDO** - Mantém `003_solicitacoes_preventivo.sql` para funcionar sem erro
- Removido constraint de chave estrangeira que causava erro 42703
- Simplificadas as policies para usar EXISTS ao invés de LIMIT 1

❌ **PENDENTE** - Botão "Gerenciar Cargos" não aparece mesmo sendo admin
- Código foi corrigido para ler `data.cargo` (não `data.role`)
- Mas ainda não está aparecendo, sugerindo problema maior

---

## Análise Estruturada do Problema

### Cenário 1: Você foi adicionado como admin, MAS a query não está encontrando seu registro

**Como verificar:**
1. Abra o **Debug Console** → `http://localhost/debug.html` (ou aperte F12)
2. Vá para abا **Tabela: user_roles** 
3. Clique em **"Ver Todos os Cargos"**
4. Procure por `joao.aviana@neoenergia.com`

**Se não estiver lá:**
- O comando SQL de admin NÃO foi executado com sucesso
- OU foi executado em outro projeto Supabase
- OU há um problema de sincronização

**Solução:**
```sql
-- No Supabase SQL Editor, execute PRIMEIRO:
SELECT * FROM user_roles;
```
Se está vazio, então execute seu email e UUID:
```sql
INSERT INTO user_roles (user_id, user_email, cargo, ativo)
VALUES (
    'SEU-UUID-AQUI',
    'joao.aviana@neoenergia.com',
    'admin',
    true
);
```

---

### Cenário 2: Você está em user_roles como admin, MAS o JavaScript não consegue ler

**Possível Causa: RLS Policy está bloqueando a leitura**

Em Supabase, mesmo queries SELECT podem ser bloqueadas por RLS policies!

**Como verificar:**
1. Debug Console → **"Ver Todos os Cargos"**
2. Se retorna erro "You do not have access to this row", é RLS

**Solução: Verificar policy de user_roles**

Execute no SQL Editor:
```sql
-- Ver policies atuais
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies
WHERE tablename = 'user_roles';
```

A policy deve permitir SELECT para usuários autenticados:
```sql
-- Se NÃO está assim, execute:
DROP POLICY IF EXISTS "Autenticados podem visualizar roles" ON user_roles;

CREATE POLICY "Autenticados podem visualizar roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);  -- Permite qualquer usuário autenticado ver
```

---

### Cenário 3: Código JavaScript tem bug que impede de mostrar o botão

**Novo logging foi adicionado para diagnosticar!**

**Como verificar:**
1. Abra `hub_subsidios.html` (ou `hub_servicos.html`)
2. Pressione `F12` para abrir Developer Tools
3. Vá abra tab **Console**
4. Procure por mensagens que começam com `[RBAC]`

**Outputs esperados:**
```
[RBAC] Session User Email: joao.aviana@neoenergia.com
[RBAC] Consultando user_roles para email: joao.aviana@neoenergia.com
[RBAC] ✓ Cargo encontrado: admin
[RBAC] ✓ Ativo: true
[RBAC] Aplicando permissões com cargo: admin
```

**Se vir:**
```
[RBAC] Erro ao buscar cargo: ERROR: new row violates row level security policy
```
→ **É RLS bloqueando a leitura** (Cenário 2)

**Se vir:**
```
[RBAC] Nenhum resultado retornou (data é undefined)
```
→ **Você NÃO está em user_roles** (Cenário 1)

---

## Plano de Ação

### HOJE - Diagnosticar
Execute na ordem:

#### Passo 1: Verificar Supabase
```sql
-- No SQL Editor, execute para ver status atual:

-- A. Você existe no auth?
SELECT id, email FROM auth.users WHERE email = 'joao.aviana@neoenergia.com';

-- B. Você está em user_roles?
SELECT * FROM user_roles WHERE user_email = 'joao.aviana@neoenergia.com';

-- C. Quais policies existem?
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
```

#### Passo 2: Debug no Browser
1. Abra `hub_subsidios.html`
2. Pressione `F12`
3. Tab **Console**
4. Procure por `[RBAC]` messages
5. **Anote tudo** e compartilhe comigo

#### Passo 3: Teste no Debug Console
1. Abra `debug.html` na dashboard
2. **Carregar Sessão** → deve mostrar seu email
3. **Carregar Cargo** → deve mostrar admin
4. **Ver Todos os Cargos** → deve mostrar você e seu cargo

---

## Checklist para Compartilhar Comigo

Quando fizer as investigações,compartilhe:

- [ ] Output de `SELECT * FROM user_roles;` do SQL Editor
- [ ] Output de `[RBAC]` messages do Console (F12 em hub_subsidios.html)
- [ ] Resultado de "Ver Todos os Cargos" no Debug Console
- [ ] Qual erro você vê (se houver)
- [ ] Seu UUID do auth.users (da query em "Passo 1: A")

---

## Causa Mais Provável (Meu palpite)

Baseado na sequência de eventos:

1. ✅ Você executou SQL para virar admin
2. ✅ SQL disse "sucesso"
3. ❌ Mas botão não apareceu

**Probabilidade Alta:** RLS Policy de `user_roles` está muito restritiva

**Próximo passo:** Execute o SQL do "Passo 1" acima e compartilhe os resultados

---

## Diferenças entre 001 e 003

| Aspecto | 001 (subsidios) | 003 (solicitacoes) |
|---------|-----------------|-------------------|
| FK reference | `references auth.users(id)` | SEM FK (removido) |
| Drop antes de criar | Não | SIM |
| Policies | Simples | EXISTS subqueries |
| Erro reportado |  Nenhum | 42703 (column user_id) |

Motivo: 003 foi criado depois e tinha erro, então corrigimos.

