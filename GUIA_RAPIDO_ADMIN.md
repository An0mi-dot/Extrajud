# RESUMO EXECUTIVO - Problemas de Admin e Dados

## Situação Geral

| Problema | Status | Solução |
|----------|--------|---------|
| Erro SQL ao executar 003 | ✅ CORRIGIDO | Nova versão sem erro 42703 |
| Botão admin não aparece | ❌ DIAGNOSTICANDO | Logging melhorado, seguir passos abaixo |
| Processos não carregam | ⏳ DEPENDE DO ADMIN | Executar 003_solicitacoes após corrigir admin |

---

## PASSO 1: Preparar (5 min)

### Passo 1.1: Atualizar migration 003
A versão anterior tinha erro. Copie a nova versão:
```
docs/migrations/003_solicitacoes_preventivo.sql
```
(Está atualizada com DROP TABLE IF e sem constraint FK)

### Passo 1.2: Recarregar aplicação
```
Pressione F5 em hub_subsidios.html (ou ctrl+R)
```

### Passo 1.3: Abrir Console (F12)
Vamos usar o console do navegador para ver os logs.

---

## PASSO 2: Diagnosticar (10 min)

### Opção A: Via SQL (mais confiável)

Abra **Supabase → SQL Editor** e execute os blocos do arquivo:
```
docs/migrations/DIAGNOSTICO_RAPIDO.sql
```

**Execute na ordem:**
1. QUERY 1 → Verifica se você existe no auth.users
2. QUERY 2 → Verifica se você está em user_roles
3. QUERY 3 → Vê quais políticas de segurança existem

**Ao executar cada query, anote o resultado.**

### Opção B: Via Debug Console (mais visual)

1. Abra `http://localhost/debug.html`
2. Clique em **"Carregar Sessão"** → Deve mostrar seu email
3. Clique em **"Carregar Cargo"** → Deve mostrar seu cargo
4. Clique em **"Ver Todos os Cargos"** → Deve listar todos usuários em user_roles

---

## PASSO 3: Corrigir (5-10 min, depende do que encontrar)

### Cenário A: Você NÃO está em user_roles

**Sintomas:**
- QUERY 2 retorna 0 linhas
- Debug Console mostra "Não encontrado"

**Solução:**
1. Execute QUERY 1 para pegar seu UUID
2. Execute QUERY 4 com seu UUID:
```sql
INSERT INTO user_roles (user_id, user_email, cargo, ativo)
VALUES (
    'SEU-UUID-AQUI',
    'joao.aviana@neoenergia.com',
    'admin',
    true
);
```

### Cenário B: Você está em user_roles MAS com cargo errado

**Sintomas:**
- QUERY 2 retorna sua linha MAS cargo ≠ 'admin'
- Você vê seu email em Debug Console MAS "Cargo: tester" ou outro

**Solução:**
```sql
UPDATE user_roles
SET cargo = 'admin', updated_at = now()
WHERE user_email = 'joao.aviana@neoenergia.com';
```

### Cenário C: RLS Policy está bloqueando a leitura

**Sintomas:**
- QUERY 3 mostra policies muito restritivas
- Debug Console mostra erro "policies don't grant"
- Console (F12) mostra: `[RBAC] Erro ao buscar cargo: ERROR...`

**Solução:**
Execute QUERY 5:
```sql
DROP POLICY IF EXISTS "Autenticados podem visualizar roles" ON user_roles;

CREATE POLICY "Autenticados podem visualizar roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);
```

### Cenário D: Bug no JS (improvável depois das correções)

**Sintomas:**
- Você está em user_roles como admin
- Mas Console (F12) mostra: `[RBAC] cargo: null` ou `[RBAC] cargo: undefined`

**Solução:**
Abra hub_subsidios.html e recarregue (F5).

---

## PASSO 4: Validar (2 min)

Após corrigir, execute:

### No Console (F12) de hub_subsidios.html:
```
Procure por: [RBAC] ✓ Cargo encontrado: admin
```

Se vir isso, sucesso! ✅

### No Debug Console:
Clique em **"Carregar Cargo"** → Deve retornar seu cargo como "admin"

### Na interface:
O botão **"Gerenciar Cargos"** deve aparecer ao lado de Configurações

---

## PASSO 5: Executar 003_solicitacoes (2 min)

Só após confirmar que você é admin:

1. Abra **Supabase → SQL Editor**
2. Copie todo conteúdo de: `docs/migrations/003_solicitacoes_preventivo.sql`
3. Cole no SQL Editor
4. Execute

Deve dar sucesso dessa vez (erro 42703 foi corrigido).

---

## Arquivo de Logs Completo

Se algo der errado, execute:
```
docs/migrations/DIAGNOSTICO_RAPIDO.sql
```

E compartilhe comigo:
- Output de cada QUERY
- Console (F12) messages que começam com `[RBAC]`
- Qualquer erro que receber

---

## Checklist Final

- [ ] Executei QUERY 1-3 em DIAGNOSTICO_RAPIDO.sql
- [ ] Anotei meu UUID de auth.users
- [ ] Confirmi que estou em user_roles com cargo='admin'
- [ ] Recarreguei a página (F5)
- [ ] Vejo `[RBAC] ✓ Cargo encontrado: admin` no Console (F12)
- [ ] Botão "Gerenciar Cargos" aparece na interface
- [ ] Executei 003_solicitacoes.sql sem erro

---

## Tempo total estimado
**~20-30 minutos** (depende de quantos problemas encontrar)

**Próxima comunicação:**
Compartilhe os outputs das QUERYs e do Console (F12) para eu ajudar com os passos específicos!

