# Setup: Email de Confirmação Automática

**Objetivo:** Quando um cliente submete um pedido via formulário Netlify, recebe email de confirmação automaticamente.

---

## 📋 Pré-requisitos

- [ ] Conta SendGrid (https://sendgrid.com) — plano grátis funciona
- [ ] Acesso ao painel Supabase do projeto
- [ ] Ter na tabela `subsidios_trabalhistas` a coluna `user_email` (e.g., `ALTER TABLE subsidios_trabalhistas ADD COLUMN user_email TEXT;`)

---

## 🔑 Passo 1: Obter API Key do SendGrid

1. Vá em https://app.sendgrid.com/settings/api_keys
2. Clique em **"Create API Key"**
3. Dê um nome: `Supabase Email Function`
4. Verifique as permissões: ✅ `Mail Send`
5. Clique em **"Create & Close"**
6. **Copie a chave** (começando com `SG.`)

> ⚠️ Guarde em local seguro — nunca compartilhe!

---

## 📦 Passo 2: Criar Edge Function no Supabase

### Opção A: Via Dashboard (Mais fácil)

1. Acesse https://supabase.com/dashboard → Seu projeto
2. Vá em **Edge Functions** (menu lateral)
3. Clique em **"Create a new Function"**
4. Nome: `send-subsidio-email`
5. Cole o código do arquivo `supabase/functions/send-subsidio-email/index.ts` deste projeto
6. Clique em **"Deploy"**

### Opção B: Via CLI (Se tiver instalado)

```bash
# 1. Execute no terminal na pasta do projeto
supabase functions deploy send-subsidio-email

# 2. Se pedir: 
#    "Enter SENDGRID_API_KEY: [cole a chave SG...]"
```

---

## 🔐 Passo 3: Adicionar Secrets do Supabase

No painel Supabase, vá em **Edge Functions** → Sua função → **Secrets**:

### Adicione 3 variáveis:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `SENDGRID_API_KEY` | Sua chave SG.* | `SG.abcd1234...` |

> ℹ️ As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são automaticamente injetadas.

**Como adicionar:**
1. Clique em **"Add secret"**
2. Key: `SENDGRID_API_KEY`
3. Value: (cole a chave do SendGrid)
4. Clique em **"Add"**

---

## 🔔 Passo 4: Criar Webhook/Trigger

No painel Supabase, vá em **Database** → **Webhooks**:

1. Clique em **"Create a new webhook"**
2. **Name:** `email-confirmacao-subsidios`
3. **Table:** `subsidios_trabalhistas`
4. **Events:** ✅ INSERT (Integrada)
5. **HTTP Method:** POST
6. **URL:** Copie da sua Edge Function (formato: `https://[project-id].supabase.co/functions/v1/send-subsidio-email`)
7. **Headers:** Deixe padrão
8. Clique em **"Create webhook"**

---

## ✅ Validação de Funcionamento

### Teste 1: Enviar um pedido via formulário

1. Abra https://subsidios-trabalhistas.netlify.app/
2. Preencha o formulário com um email válido (seu)
3. Clique em **"Enviar Pedido"**
4. Você deve receber um email em ~5-10 segundos

### Teste 2: Verificar logs

No painel Supabase → **Edge Functions** → sua função → **Logs**:

```
✅ Email enviado para seu.email@empresa.com
```

---

## 🚨 Troubleshooting

### ❌ "401 Unauthorized" do SendGrid
- **Causa:** API Key inválida ou expirada
- **Solução:** Verifique se a chave começa com `SG.` e está correta

### ❌ Email não chegou
- **Verificar:** Pasta de SPAM
- **Verificar logs** em Supabase → Edge Functions
- **Confirmar:** `user_email` está preenchido na tabela

### ❌ Webhook não despara
- **Verificar:** O webhook está ativado (toggle verde)
- **Verificar:** A URL da función está correta (copiar novamente)
- **Testar:** Inserir um registro manualmente via Supabase e verificar logs

---

## 📧 Customizar Template do Email

O arquivo `supabase/functions/send-subsidio-email/index.ts` contém o template HTML.

Para mudar:
1. Edite a variável `emailHtml` no arquivo
2. Re-deploy: `supabase functions deploy send-subsidio-email`

Ou clique em **"Edit"** no painel Supabase.

---

## 📍 Checklist de Conclusão

- [ ] Chave SendGrid obtida (SG.*)
- [ ] Edge Function criada no Supabase
- [ ] Secret `SENDGRID_API_KEY` adicionado
- [ ] Webhook criado e ativado
- [ ] Teste com email real funcionou
- [ ] Email aparece na inbox (ou spam)
- [ ] Campo `user_email` preenchido no formulário

---

## ℹ️ Notas

- **Email de** = `juridico@neoenergia.com` (customize em `index.ts` se precisar)
- **Email para** = Vem do campo `email` do formulário
- **Assunto** = Automático: "Confirmação de recebimento - Subsídio Trabalhista"
- **Frequência** = Imediata (quando novo registro é criado)

---

## 🔗 Recursos

- SendGrid Docs: https://docs.sendgrid.com/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Database Webhooks: https://supabase.com/docs/guides/database/webhooks
