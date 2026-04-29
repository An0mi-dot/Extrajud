# 🚀 GUIA DE DEPLOY - Subsidios Trabalhistas v2.0

## ⚡ Quick Start (5 min)

### **1️⃣ Executar Migration SQL no Supabase**

```sql
-- ✅ PASSO 1: Abra Supabase Console
-- Link: https://app.supabase.com/project/[seu-projeto]

-- ✅ PASSO 2: Vá para SQL Editor → New Query

-- ✅ PASSO 3: Cole o arquivo abaixo e execute
-- 📄 Arquivo: supabase/migrations/005_email_queue_history.sql
```

**O que faz:**
- Cria tabela `email_queue` para fila de emails
- Cria tabela `email_history` para auditoria
- Adiciona índices para performance
- Configura RLS (segurança por role)

**Resultado esperado:**
```
✓ Created table "email_queue"
✓ Created table "email_history"
✓ Created index "idx_email_queue_status"
✓ Created RLS policy "Email queue visible to service role only"
✓ Done
```

---

### **2️⃣ Deploy Edge Function**

```bash
# Terminal > Navigate to project root
cd /path/to/EXTRATJUD

# Deploy function to Supabase
npx supabase functions deploy send-subsidio-email

# Resultado:
# ✓ Deployed function send-subsidio-email
```

**O que faz:**
- Atualiza função TypeScript no Supabase
- Ativa webhook para processos novos
- Enfileira emails automaticamente

---

### **3️⃣ Reiniciar Aplicativo**

```bash
# Opção A: Desenvolvimento
npm start

# Opção B: Produção
npm run build
# ou rodar .exe gerado
```

---

## ✅ Checklist Pós-Deploy

Após fazer o deploy acima, valide:

- [ ] **Email Queue criada**
  - Supabase → Database → Tables → procure por `email_queue`
  - Deve ter colunas: id, processo_id, destinatario_email, assunto, corpo_html, status, tentativas, criado_em, enviado_em

- [ ] **Email History criada**
  - Supabase → Database → Tables → procure por `email_history`
  - Deve ter colunas: id, processo_id, destinatario_email, status, enviado_em, resposta_servidor

- [ ] **Feature: Validação CPF**
  - Abra o app
  - Vá para "Novo Processo"
  - Digite CPF inválido: `000.000.000-00`
  - Clique "Salvar no Banco"
  - ✓ Deve mostrar alerta: "⚠️ CPF inválido"

- [ ] **Feature: Notificações Avançadas**
  - Vá para "Processos" → clique em um
  - Vá para aba "Detalhe"
  - Mude status para "Cancelado"
  - Clique "Salvar Status"
  - ✓ Deve aparecer notificação desktop 🚨 (crítico)

- [ ] **Feature: Relatório Semanal**
  - Clique em aba "Semanal"
  - ✓ Deve mostrar KPIs da semana
  - Clique "Exportar"
  - ✓ Arquivo CSV/Excel deve ser gerado

- [ ] **Feature: Dashboard SLA**
  - Clique em aba "Painel"
  - ✓ Deve ver novo card "📊 Dashboard SLA"
  - Com 3 caixas: Vencidos | Críticos | Ok

- [ ] **Feature: Permissões por Role**
  - Login como Antonio Fernando (antonio.flima@...)
  - Vá para "Processos"
  - ✓ Deve ver apenas processos de Salvador
  - Logout e login como Iane Naira (iane.velame@...)
  - ✓ Deve ver apenas processos de Itabuna

---

## 🐛 Diagnosticar Problemas

### **Problema: Email Queue não aparece no Supabase**
```
❌ Solução:
1. Verifique se SQL foi executado (checar Supabase → SQL Editor → Logs)
2. Tente executar novamente o arquivo 005_email_queue_history.sql
3. Checar erro: usuário pode não ter permissão para criar tabelas
```

### **Problema: Notificações não aparecem**
```
❌ Solução:
1. Abra DevTools: F12 → Console
2. Mude status de um processo
3. Procure por erros no console
4. Verifique se desktop notifications estão habilitadas (Windows Settings → Notifications)
5. Teste em processo que exista window.currentProcesso
```

### **Problema: CPF válido está sendo rejeitado**
```
❌ Solução:
1. Verifique se o CPF tem 11 dígitos
2. Teste com CPF conhecido como válido: (gere com algoritmo)
3. Limpe máscara: função validarCPF() remove automaticamente
4. Se ainda falhar, abra console (F12) e rode:
   > validarCPF("123.456.789-09")
   > true/false irá indicar resposta
```

### **Problema: Relatório Semanal vazio**
```
❌ Solução:
1. Verifique se há processos registrados esta semana
2. Cheque data atual no sistema
3. Se criou processos com data errada, atualize em Supabase
4. Recarregue a página: F5
```

### **Problema: Dashboard SLA mostra 0 em tudo**
```
❌ Solução:
1. Verifique se há processos com campo 'prazo' preenchido
2. Se todos os processos estão "Concluído", SLA não conta-os
3. Crie processo teste com prazo definido
4. Dashboard deve atualizar ao clicar aba "Painel"
```

---

## 📊 Verificación de Integridad (Advanced)

Execute no console do Supabase (SQL Editor):

```sql
-- Checar email_queue
SELECT COUNT(*) as total_na_fila, 
       status, 
       COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes
FROM email_queue
GROUP BY status;

-- Checar email_history
SELECT COUNT(*) as total_enviados
FROM email_history
WHERE status = 'enviado';

-- Checar policies
SELECT * FROM information_schema.role_table_grants 
WHERE table_name IN ('email_queue', 'email_history');
```

---

## 🔄 Reversão (Se necessário)

Se algo der errado e precisar reverter:

```sql
-- ⚠️ CUIDADO: Isso DELETA as tabelas
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS email_history CASCADE;

-- Depois, reexecute:
-- npx supabase functions delete send-subsidio-email
```

---

## 📞 Contato & Suporte

Se encontrar problemas:

1. **Verifique console do DevTools:** F12 → Console
2. **Logs do Supabase:** Supabase → Logs → Function Invocations
3. **Database:** Supabase → SQL Editor → rode queries de diagnóstico
4. **Arquivo de referência:** IMPLEMENTACAO_CONCLUIDA.md

---

## ✨ Sucesso!

Após validar o checklist acima, seu sistema estará **100% operacional** com:

- ✅ Email automático enfileirado
- ✅ Validação CPF robusta
- ✅ Notificações avançadas
- ✅ Relatório semanal exportável
- ✅ Dashboard SLA visual
- ✅ Permissões por role

**Bom trabalho! 🎉**
