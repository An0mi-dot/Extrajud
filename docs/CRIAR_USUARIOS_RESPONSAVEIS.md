# 🔐 Guia: Criando Usuários para Subsidios - Antonio Fernando e Iane Naira

## 📋 Dados dos Usuários

| Campo | Antonio Fernando | Iane Naira |
|-------|------------------|-----------|
| **Email** | antonio.flima@neoenergia.com | iane.velame@neoenergia.com |
| **Senha** | **Neo426891** | **Neo783654** |
| **Cargo** | Responsável Comarca | Responsável Comarca |
| **Comarca** | Salvador | Itabuna |
| **Status** | Ativo | Ativo |

---

## 🚀 Etapa 1: Criar Usuários no Supabase Console

### Opção A: Via Supabase Admin Console (Recomendado)

1. Acesse: **https://app.supabase.com**
2. Selecione seu projeto (lvicpvodestuhptsaqba)
3. Vá para **Authentication** → **Users**
4. Clique em **+ Add user**

**Para Antonio Fernando:**
- Email: `antonio.flima@neoenergia.com`
- Password: `Neo426891`
- Confirm password: `Neo426891`
- ✅ Auto confirm user (marque a caixa)
- Clique **Create user**
- **⚠️ Copie o UUID do usuário** (apareça no topo ou na lista)

**Para Iane Naira:**
- Email: `iane.velame@neoenergia.com`
- Password: `Neo783654`
- Confirm password: `Neo783654`
- ✅ Auto confirm user (marque a caixa)
- Clique **Create user**
- **⚠️ Copie o UUID do usuário** (apareça no topo ou na lista)

---

### Opção B: Via API (Node.js Script)

Se preferir automatizar, execute no seu terminal após instalar o Supabase Admin SDK:

```bash
npm install @supabase/supabase-js
```

Crie um arquivo `create_users.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lvicpvodestuhptsaqba.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // service_role key (veja abaixo)
);

async function createUsers() {
  // Antonio Fernando
  const { data: antonio, error: err1 } = await supabase.auth.admin.createUser({
    email: 'antonio.flima@neoenergia.com',
    password: 'Neo426891',
    email_confirm: true
  });
  console.log('Antonio:', antonio?.user?.id, err1);

  // Iane Naira
  const { data: iane, error: err2 } = await supabase.auth.admin.createUser({
    email: 'iane.velame@neoenergia.com',
    password: 'Neo783654',
    email_confirm: true
  });
  console.log('Iane:', iane?.user?.id, err2);
}

createUsers();
```

**Para obter a `service_role_key`:**
1. Vá para **Settings** → **API**
2. Copie a chave em **Service Role** (⚠️ Nunca compartilhe publicamente!)

---

## 🎯 Etapa 2: Registrar Roles no Banco de Dados

Após criar os usuários, você terá os UUIDs. Execute no **Supabase SQL Editor**:

```sql
-- PRIMEIRO: Execute a migration
-- (Copie e cole o conteúdo de docs/migrations/002_user_roles.sql)

-- DEPOIS: Insira os usuários com seus cargos
INSERT INTO user_roles (user_id, user_email, cargo, comarca, ativo)
VALUES 
  ('<UUID_ANTONIO>', 'antonio.flima@neoenergia.com', 'Responsável Comarca', 'Salvador', true),
  ('<UUID_IANE>', 'iane.velame@neoenergia.com', 'Responsável Comarca', 'Itabuna', true);
```

**Substitua:**
- `<UUID_ANTONIO>` pelo UUID do Antonio (ex: `550e8400-e29b-41d4-a716-446655440000`)
- `<UUID_IANE>` pelo UUID da Iane

---

## ✅ Etapa 3: Testar Login

1. Inicie o EXTRATJUD
2. Clique em **"Não tem conta? Cadastre-se"** ou use login direto
3. Teste com:
   - **Email:** antonio.flima@neoenergia.com
   - **Senha:** Neo426891
4. Após login bem-sucedido, verifique:
   - Painel carregue corretamente
   - Comarca **Salvador** mostre **Antonio Fernando** como responsável
   - Comarca **Itabuna** mostre **Iane Naira** como responsável

---

## 🔔 Etapa 4: Configurar Notificações (Próximo Passo)

Após usuários criados, precisamos:
1. Atualizar `hub_subsidios.html` para mostrar notificações apenas para o responsável
2. Verificar se a comarca do novo processo match com a comarca do usuário logado
3. Se corresponder → Enviar notificação Windows

---

## 📝 Notas Importantes

- ✅ Senhas enviadas: **Neo426891** (Antonio) e **Neo783654** (Iane)
- ✅ Senhas seguem o padrão "Neo" + 6 números
- ✅ Email confirmation automático (não precisa clicar link)
- ⚠️ Guarde os UUIDs dos usuários para a próxima etapa
- ⚠️ As senhas podem ser alteradas pelo próprio usuário após primeiro login

---

## 🆘 Troubleshooting

**Erro: "Email already exists"**
- O email já está registrado no Supabase. Verifique em Users se precisa limpar.

**Erro: "Invalid password"**
- Supabase requer mínimo 6 caracteres. Nossas senhas têm 9 (Neo + 6 dígitos) ✅

**Usuário não consegue logar no EXTRATJUD**
- Verifique se `email_confirm` está `true`
- Verifique se o user_email em `user_roles` match com o email exato
- Limpe cache do navegador (Ctrl+Shift+Del)
