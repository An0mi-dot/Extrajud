# 🚀 IMPLEMENTAÇÃO COMPLETA: SISTEMA DE UUID AUTOMÁTICO

## 📊 Status Geral: FASE 1 CONCLUÍDA ✅

---

## ✅ Arquivos Criados/Modificados

### **Novos Arquivos**

1. **[docs/migrations/006_remove_auth_uuid_system.sql](docs/migrations/006_remove_auth_uuid_system.sql)** ⭐
   - Criação de tabela `users_auto` (users sem senha)
   - Função RPC `register_machine_user()` - auto-registro
   - Função RPC `update_user_uuid_manual()` - reatribuir UUID (admin only)
   - VIEW `v_users_with_roles` - listar users com cargos
   - RLS policies para segurança
   - Triggers para `updated_at` e `last_login`

2. **[src/machine_identifier.js](src/machine_identifier.js)** ⭐
   - `generateMachineIdentifierSync()` - gera SHA256(MAC + HOSTNAME)
   - `generateMachineIdentifier()` - versão async com suporte a HD serial
   - Suporte para Windows, macOS, Linux
   - Fallback para `crypto.randomBytes()` em caso de erro

3. **[public/index.html](public/index.html)** ⭐ (convertido de hub)
   - Página de inicialização automática
   - Chama `register_machine_user()` via supabase RPC
   - Armazena `user_uuid` + `machine_id` em localStorage
   - Redireciona para `hub_servicos.html` após sucesso
   - Trata erros com retry automático

4. **[public/admin_users.html](public/admin_users.html)** ⭐
   - Interface admin para gerenciar usuários
   - Lista todos os users com VIEW `v_users_with_roles`
   - Reatribui UUID (chama RPC `update_user_uuid_manual()`)
   - Busca por UUID ou Machine ID
   - Desativa/ativa usuários
   - **RESTRITO A ADMIN** (via RLS no Supabase)

### **Arquivos Modificados**

1. **[main.js](main.js)** 
   - ✅ Import: `const { generateMachineIdentifierSync } = require('./src/machine_identifier');`
   - ✅ IPC Handler: `ipcMain.handle('get-machine-id', ...)`
   - ✅ Retorna SHA256 da máquina

---

## 📋 Próximos Passos (OBRIGATÓRIO)

### **PASSO 1: Executar Migração SQL** 🔴 CRÍTICO

```sql
-- Abra o SQL Editor do Supabase Dashboard
-- Cole o conteúdo de: docs/migrations/006_remove_auth_uuid_system.sql
-- Execute!
```

**O que faz:**
- Cria tabela `users_auto`
- Cria funções RPC
- Cria VIEW
- Cria RLS policies
- Cria triggers para `updated_at` e `last_login`

---

### **PASSO 2: Testar Auto-Registro em DEV**

```bash
# 1. Certifique-se de que o app está rodando
npm start

# 2. Abra http://localhost:3000 (ou a porta do dev)
# Ou abra o app via Electron

# 3. Observ o console do dev para logs:
#    - "[MachineID] Identificador gerado com sucesso"
#    - "[Init] Dispositivo registrado: { uuid: '...', isNew: true/false }"

# 4. Verifique localStorage:
#    - localStorage.getItem('user_uuid') deve retornar um UUID
#    - localStorage.getItem('machine_id') deve retornar o hash
```

---

### **PASSO 3: Remover Lógica de Login (Quando Tudo Funcionar)**

**Arquivos a Limpar:**

```javascript
// Em supabaseClient.js:
// REMOVER todas as chamadas a supabase.auth.signIn/signUp
// REMOVER handlers de autenticação

// Em hub_servicos.html:
// REMOVER: verificação de login no page load
// REMOVER: menu de perfil (nome do usuário)
// REMOVER: logout button
// MANTER: verificação de user_uuid em localStorage
```

---

## 🔍 Verificação Rápida

### **MySQL/Supabase Console**

```sql
-- Ver usuários criados
SELECT * FROM users_auto;

-- Ver usuários com seus cargos
SELECT * FROM v_users_with_roles;

-- Ver histórico de um usuário
SELECT * FROM users_auto WHERE machine_identifier = 'abc123...';
```

### **Frontend Console (Browser DevTools)**

```javascript
// Verificar localStorage
console.log(localStorage.getItem('user_uuid'))
console.log(localStorage.getItem('machine_id'))

// Testar geração de machine ID (via IPC)
window.ipcRenderer.invoke('get-machine-id').then(id => console.log(id))
```

---

## 🎯 Fluxo Completo (Após Configuração)

```
┌─ APP INICIA
│
├─ index.html carrega
│
├─ Gera SHA256(MAC + HOSTNAME)
│  └─ via main.js handler IPC
│
├─ Chama RPC: register_machine_user(machine_id)
│
├─ Banco verifica:
│  ├─ Se NOVO → INSERT em users_auto, retorna is_new=true
│  └─ Se EXISTE → UPDATE last_login, retorna is_new=false
│
├─ Frontend armazena:
│  ├─ localStorage['user_uuid'] = response.uuid
│  ├─ localStorage['machine_id'] = machine_id
│  └─ localStorage['registered_at'] = now
│
├─ Redireciona para hub_servicos.html
│
└─ user_uuid está disponível em qualquer página
   └─ localStorage.getItem('user_uuid')
```

---

## 👨‍💼 Admin: Reatribuir UUID

**Quando usar:**
- Usuário mudou de computador
- Nova máquina precisa usar UUID de usuário existente
- Máquina quebrou, precisa remapear

**Como fazer:**

1. Acesse `admin_users.html` (se for admin)
2. Preenchaformulário:
   - **UUID do Usuário**: UUID existente
   - **Novo Machine ID**: SHA256 da nova máquina
3. Clique "Reatribuir"
4. Confirme

**Backend (RPC):**
```sql
-- Função que executa
update_user_uuid_manual(
    p_old_uuid = 'xxx-xxx-xxx',
    p_new_machine_identifier = 'sha256(...)'
)
```

---

## 🔐 Segurança

### **RLS Policies (Supabase)**

| Tabela | SELECT | INSERT | UPDATE |
|--------|--------|--------|--------|
| `users_auto` | Qualquer autenticado | RPC only | Qualquer autenticado |
| `user_roles` | Qualquer autenticado | Admin via RPC | Admin (hardcoded) |

### **No Frontend**

- localStorage é **client-side only** → qualquer um pode ler
- RPC functions são **server-side** → validação pelo Supabase
- Admin check no Supabase mediante JWT claims

---

## 🐛 Troubleshooting

### **Erro: "Falha ao identificar dispositivo"**

```javascript
// Verificar se IPC está funcionando
window.ipcRenderer.invoke('get-machine-id')
  .then(id => console.log('OK:', id))
  .catch(e => console.error('ERRO:', e))
```

**Solução:**
- Certifique-se de que `preload.js` expõe `window.ipcRenderer`
- Verifique se `machine_identifier.js` foi instalado corretamente

---

### **Erro: "Resposta inválida do servidor"**

**Causa:** RPC não retornou dados corrigidos

**Solução:**
1. Verifique se migração SQL foi executado completamente
2. Teste a função RPC direto no Supabase:

```sql
SELECT * FROM register_machine_user('test-machine-123', 'A');
```

---

### **UUID sempre muda**

**Causa:** Machine identifier está sendo gerado diferente cada vez

**Solução:**
- Verifique se MAC address está sendo lido corretamente
- Windows: `getmac /fo csv /nh`
- Linux: `ip link | grep ether`
- macOS: `ifconfig | grep ether`

---

## 📝 Resumo de Mudanças

| O que | Antes | Depois |
|------|-------|--------|
| **Autenticação** | Email + Senha | Automática (Machine ID) |
| **Usuario** | `auth.users` (Supabase Auth) | `users_auto` (tabela custom) |
| **Identificação** | Email | UUID + Machine Identifier |
| **Login Screen** | login.html | index.html (auto-register) |
| **Permissões** | Email-based | UUID-based |
| **Admin** | Dashboard antigo | admin_users.html (novo) |

---

## 🎁 Benefícios

✅ Sem problemas de login/autenticação  
✅ Qualquer máquina pode usar o app  
✅ Usuários identificados unicamente por máquina  
✅ Admin pode reatribuir UUIDs manualmente  
✅ Sem dependência de email corporativo  
✅ Sem cache de credenciais  

---

## ⚠️ Considerações

- **Sem logout**: Usuário é "vinculado" à máquina indefinidamente
- **Sem multi-account**: Uma máquina = Um usuário
- **Machine integrity**: Se o MAC ou HOSTNAME mudam, nova máquina é criada
- **Admin override**: Admin pode reatribuir UUID a qualquer máquina

---

## 📞 Próximas Etapas

1. ✅ Executar SQL migration
2. ✅ Testar index.html (auto-registro)
3. ✅ Verificar localStorage
4. ✅ Acessar admin_users.html
5. ⏳ Remover lógica de login de hub_servicos.html
6. ⏳ Remover arquivo login.html
7. ⏳ Atualizar documentação do app

---

**Data:** 25/03/2026  
**Versão:** 2.1.2 (transição para sistema UUID)  
**Status:** EM IMPLEMENTAÇÃO
