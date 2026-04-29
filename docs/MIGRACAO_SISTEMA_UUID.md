# 📋 MIGRAÇÃO: REMOVER SISTEMA DE LOGIN → SISTEMA DE UUID AUTOMÁTICO

## Status: EM PROGRESSO

### ✅ Concluído

1. **Migração SQL (006)**
   - ✅ Criada tabela `users_auto` com campos: user_uuid, machine_identifier, first_seen, last_login, ativo
   - ✅ Função RPC `register_machine_user()` para auto-registro
   - ✅ Função RPC `update_user_uuid_manual()` para admin reatribuir (não implementada ainda na UI)
   - ✅ RLS policies para table `users_auto`
   - ✅ VIEW `v_users_with_roles` para admin ver todos users com cargos

2. **Machine Identifier (Frontend)**
   - ✅ Arquivo `src/machine_identifier.js` criado
   - ✅ Função `generateMachineIdentifierSync()` usa SHA256(MAC + HOSTNAME)
   - ✅ Função `generateMachineIdentifier()` (async) com suporte a HD serial

3. **Página de Auto-Registro**
   - ✅ `public/index.html` convertida de hub para página de init
   - ✅ Exibe "Registrando dispositivo..."
   - ✅ Chama RPC `register_machine_user()` no load
   - ✅ Armazena user_uuid e machine_id em localStorage
   - ✅ Redireciona para hub_servicos.html após sucesso

4. **Backend (Main Process)**
   - ✅ Handler IPC `get-machine-id` adicionado
   - ✅ Import de `machine_identifier.js` 
   - ✅ Retorna SHA256 da máquina ao frontend

---

### 🔄 Em Progresso

**Nada em progresso - próximas tarefas:**

---

### ⏳ Pendente

#### 1. **Remover Sistema de Autenticação**
- [ ] Remover imports/código de autenticação do `supabaseClient.js`
- [ ] Remover lógica de login do `hub_servicos.html`
- [ ] Remover menu de perfil do `hub_servicos.html` (nome do usuário)
- [ ] Apagar arquivo `public/login.html` (ou deixar como fallback)

#### 2. **Modificar Hub Principal (index.html)**
- [ ] Adicionar lógica para carregar user_uuid do localStorage
- [ ] Remover nome de usuário da tela de bem-vindo
- [ ] Manter apenas "Bem-vindo" genérico

#### 3. **Criar Página de Admin (admin_users.html)**
- [ ] Listar todos os users de `users_auto`
- [ ] Interface para editar `machine_identifier` 
- [ ] Reatribuir UUID para machine específica
- [ ] Ver último login, data de criação, etc
- [ ] Ativar/desativar users
- [ ] Atribuir/remover cargos de `user_roles`
- [ ] **Restrito apenas a admin** (via RLS)

#### 4. **Criar Página de User Profile (sem login)**
- [ ] Mostrar UUID da máquina (read-only)
- [ ] Mostrar machine_identifier (hash)
- [ ] Mostrar primeiro acesso e último acesso
- [ ] Botão "Sair" → limpa localStorage (opcional)
- [ ] **Sem alteração de senha, email ou nome**

#### 5. **Atualizar Todas as Pages que Usam Auth**
- [ ] `hub_servicos.html` - remover verificação de login
- [ ] `hub_solicitacoes.html` - remover verificação
- [ ] `hub_subsidios.html` - remover verificação
- [ ] `database-viewer.html` - remover verificação
- [ ] `debug.html` - remover verificação
- [ ] Substituir por verificação de user_uuid em localStorage

#### 6. **Atualizar Main Process**
- [ ] Remover redirect para `login.html`
- [ ] Sempre abrir `index.html` (auto-registro)
- [ ] Handler para limpar localStorage (logout)

#### 7. **Migração de Dados Existentes**
- [ ] **DELETAR** todos os usuários de `auth.users`? (como você pediu)
- [ ] **DELETAR** registros órfãos de `user_roles`?
- [ ] Ou migrar emails existentes para novo sistema?

---

## 🔑 Schema Nova de Autenticação

### Fluxo Novo:
```
┌─────────────────────────────┐
│  App Abre index.html        │
└────────────┬────────────────┘
             │
    ┌────────▼─────────────────────────────┐
    │ 1. Gera SHA256(MAC + HOSTNAME)      │
    │    via generateMachineIdentifierSync()│
    └────────┬───────────────────────────┘
             │
    ┌────────▼─────────────────────────────┐
    │ 2. Chama RPC register_machine_user() │
    │    com machine_identifier             │
    └────────┬───────────────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │ 3. Retorna user_uuid + is_new      │
    │    Se é novo -> INSERT em users_auto│ 
    │    Se existe -> UPDATE last_login   │
    └────────┬───────────────────────────┘
             │
    ┌────────▼───────────────────────────┐
    │ 4. Armazena em localStorage:        │
    │    - user_uuid                      │
    │    - machine_id                     │
    │    - registered_at                  │
    └────────┬───────────────────────────┘
             │
    ┌────────▼──────────────────────────┐
    │ 5. Redireciona para hub_servicos   │
    │    ou outro módulo                 │
    └───────────────────────────────────┘
```

### Permissões (RLS):
- **users_auto**: Qualquer autenticado pode ler; INSERT/UPDATE via RPC only
- **user_roles**: Qualquer autenticado pode ler; UPDATE/INSERT apenas admin

### Admin Actions:
```javascript
// Reatribuir UUID para nova máquina
supabase.rpc('update_user_uuid_manual', {
    p_old_uuid: 'xxx',
    p_new_machine_identifier: 'sha256(...)'
})
```

---

## 📝 Notas

- **Sem autenticação**: O app funciona para QUALQUER máquina com Electron instalado
- **Permissões via UUID**: O sistema de cargos (`user_roles`) ainda funciona, mas agora baseado em `user_uuid` em vez de email
- **Machine Identifier**: SHA256 de MAC + HOSTNAME é único para cada computador
- **Backer para Admin**: Página `admin_users.html` permite que admin reatribua UUIDs manualmente
- **Sem localStorage.setItem manualmente**: Só o app pode criar/atualizar users_auto via RPC

---

## 🚀 Próximos Passos

1. Executar migração SQL 006 no Supabase
2. Testar auto-registro com index.html
3. Criar admin_users.html
4. Remover lógica de login de todos os arquivos
5. Testar fluxo completo
