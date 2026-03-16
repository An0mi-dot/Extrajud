# 🔍 Análise Técnica: O Que Deu Errado

## Problema 1: UUID Placeholder nas Policies ❌

### O Que Aconteceu?

Você viu isso nas policies:
```sql
auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid
```

Este é um **UUID placeholder** (todos zeros) - nunca deve estar em código de produção.

### Por Que Aconteceu?

Quando o arquivo `002_user_roles.sql` foi criado, ele tinha um comentário:
```sql
-- Placeholder para admin check
```

E alguém (provavelmente eu) nunca preencheu com um UUID real.

### Por Que Causa Problema?

Supabase interpreta essa policy assim:
```
"Apenas o usuário com UUID 00000000-0000-0000-0000-000000000000 pode fazer isso"
```

Ninguém na história da computação tem esse UUID! Então **ninguém consegue ser admin**.

### A Comparação

| UUID esperado | UUID na policy | Resultado |
|---|---|---|
| `a1b2c3d4-...` | `00000000-...` | ❌ NÃO MATCH → Acesso bloqueado |
| `a1b2c3d4-...` | `a1b2c3d4-...` | ✅ MATCH → Acesso concedido |

---

## Problema 2: Infinite Recursion em 003 ❌

### O Que Aconteceu?

Quando você tentou executar `003_solicitacoes_preventivo.sql`:
```
infinite recursion detected in policy for relation "user_roles"
```

### Por Que Aconteceu?

A migration 003 tinha uma policy que fazia:
```sql
CREATE POLICY "Admin pode fazer tudo"
    ON solicitacoes_preventivo FOR ALL
    USING ((SELECT cargo FROM user_roles WHERE user_id = auth.uid()) = 'admin');
```

Isso significa: "Na tabela solicitacoes, consulte user_roles para verificar se é admin"

MAS ao mesmo tempo, `user_roles` tinha policies que também consultavam outras tabelas, criando um loop:
```
solicitacoes_preventivo policy → user_roles check
    → user_roles policy → possível referência circular
        → infinito!
```

### A Solução

Simplificar: solicitacoes_preventivo agora apenas verifica `user_id = auth.uid()`:
```sql
CREATE POLICY "Users see own solicitacoes"
    ON solicitacoes_preventivo FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
```

Sem referências cruzadas → Sem recursão.

---

## Problema 3: DevTools Bloqueado ❌

### O Que Aconteceu?

Você não conseguia abrir o Console (F12).

### Por Que Aconteceu?

Em `main.js`, havia código:
```javascript
if (currentUser && currentUser.role === 'admin') {
    mainWindow.webContents.toggleDevTools();
} else {
    console.log('Blocked unauthorized DevTools access attempt.');
}
```

Isso verifica: "É você um admin?"

MAS `currentUser.role` **nunca foi preenchido** porque:
1. O login usa `.cargo` (não `.role`)
2. O frontend lê `user_roles.cargo` (não `user_roles.role`)
3. O `currentUser` no main.js nunca teve seu `.role` atualizado

Então `currentUser.role` sempre era `null` → DevTools sempre bloqueado.

---

## Resumo das Causas Raiz

| Problema | Causa Raiz | Solução |
|----------|-----------|---------|
| Ninguém é admin | UUID placeholder em policies | Remover policies antigas, criar novas SEM placeholder |
| 003 falha com recursão | Queries circulares em RLS | Simplificar solicitacoes_preventivo para não referenciar user_roles |
| F12 bloqueado | currentUser.role nunca preenchido | Remover verificação de admin, permitir F12 para todos (temp) |

---

## Arquitetura Corrigida

### Fluxo de Autenticação (Agora Correto)

```
1. Frontend: index.html (login)
   ↓
2. Supabase Auth: cria sessão
   ↓
3. Frontend: hub_subsidios.html inicia
   ↓
4. Script initRoles() executa:
   - Pega session.user.email do Supabase Auth
   - Query: SELECT cargo FROM user_roles WHERE user_email = ?
   - Define currentRole = data.cargo
   ↓
5. applyPermissions() verifica:
   - Se currentRole === 'admin' → mostra botão
   - Se currentRole === 'tester' → ativa F5+T
   ↓
6. Interface atualiza com as permissões
```

### Tabela user_roles (Agora Segura)

```sql
CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY,
    user_email TEXT NOT NULL,
    cargo TEXT,  -- 'admin', 'tester', 'pastas', etc
    ativo BOOLEAN
);

-- Policies SIMPLES (sem recursão):
-- 1. Todos autenticados podem LER (SELECT * FROM user_roles)
-- 2. Admins podem ESCREVER (INSERT/UPDATE/DELETE)
```

### Tabela solicitacoes_preventivo (Agora Simples)

```sql
CREATE TABLE solicitacoes_preventivo (
    id UUID PRIMARY KEY,
    titulo TEXT,
    user_id UUID,  -- Dono da solicitação
    ...
);

-- Policy SIMPLES (sem referências):
-- 1. User vê apenas suas próprias solicitações (user_id = auth.uid())
-- 2. Sem verificação de admin (admin é gerenciado no frontend)
```

---

## Por Que Essas Arquiteturas São Melhores?

### ✅ Seguro
- Sem UUIDs placeholders
- Sem recursão infinita
- RLS policies simples e previsíveis

### ✅ Debugável
- Frontend envia [RBAC] logs para console
- SQL queries são simples (não há subqueries complexas)
- DevTools acessível para desenvolvimento

### ✅ Manutenível
- Alterações em um lugar não quebram outro
- Fácil adicionar novos cargos (admin, tester, pastas, etc)
- RLS policies são 3 linhas cada, não 10

---

## Conceitos Supabase Importantes

### RLS (Row Level Security)
```
RLS Policy = uma regra de segurança que filtra QUAIS LINHAS 
você consegue ver/editar em uma tabela
```

**Bom:**
```sql
CREATE POLICY "Users see own rows"
    ON table FOR SELECT USING (user_id = auth.uid());
```
→ "Cada usuário vê apenas suas linhas"

**Ruim:**
```sql
CREATE POLICY "Check admin"
    ON table FOR SELECT 
    USING (EXISTS(SELECT 1 FROM user_roles WHERE...));
```
→ "Consulte outra tabela para verificar permissão" ← Pode causar recursão!

### AUTH.UID()
```
auth.uid() = UUID do usuário autenticado no Supabase
```

É sempre comparado contra a coluna `user_id` ou `user_email`.

---

## Lições Aprendidas

1. **Nunca use UUID placeholder** em produção - use `NULL` ou valores reais
2. **RLS policies devem ser simples** - evite referências cruzadas
3. **Separar concerns**:
   - Supabase RLS = segurança básica (quem vê o quê)
   - Frontend = lógica de permissões (admin, tester, etc)
4. **DevTools para desenvolvimento** - não bloquear F12 durante debugging!

---

## Próxima Revisão (Quando Ficar Estável)

Depois que admin funcion acompletamente, considere:

1. **Re-abilitar proteção de DevTools** em main.js
2. **Adicionar admin policy correta** em solicitacoes_preventivo para admins poderem ver tudo
3. **Auditoria de RLS** em todas as tabelas (subsidios_trabalhistas, user_roles, solicitacoes_preventivo)

