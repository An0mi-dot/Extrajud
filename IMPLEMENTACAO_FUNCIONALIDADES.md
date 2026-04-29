# 🚀 Instruções para Implementar Funcionalidades de Subsídios

**Data:** 16 de Março de 2026  
**Status:** Pronto para Implementação

---

## ⚠️ IMPORTANTE — EXECUTAR ANTES

Todas as novas funcionalidades dependem de uma migração SQL no Supabase. Sem isso, o sistema não funcionará.

### Passo 1: Executar Migração SQL

1. Acesse **Supabase Dashboard** → Seu projeto → **SQL Editor**
2. Cole o conteúdo de: [`docs/migrations/004_comarca_responsaveis.sql`](docs/migrations/004_comarca_responsaveis.sql)
3. Clique **Execute** (Ctrl+Enter)
4. Aguarde conclusão ✅

**O que essa migração cria:**
- Novo campo `responsavel_comarca` na tabela `subsidios_trabalhistas`
- Novo campo `area_origem` na tabela `subsidios_trabalhistas`
- Tabela `comarca_responsaveis` com mapeamento: comarca → responsável
- Tabela `areas_enum` com lista de áreas (RH, GSS, Folha, etc.)
- Inserção automática de comarcas-padrão e responsáveis

---

## ✨ Funcionalidades Implementadas

### 1️⃣ AUTO-ATRIBUIÇÃO POR COMARCA

**O que faz:**
- Quando um novo processo é criado, o sistema automaticamente atribui um responsável baseado na comarca informada
- Ex: Comarca "Salvador" → responsável "Antonio Fernando"
- Se a comarca não estiver mapeada, permite preenchimento manual

**Como funciona:**
```javascript
// No hub_subsidios.html - linha ~1110
// Carrega mapeamento de comarcas no início
await carregarComarcasResponsaveis();

// Ao salvar novo processo - linha ~1150
let responsavelAtribuido = responsavel;
if (!responsavelAtribuido && comarca && comarcaResponsavelMap[comarca]) {
    responsavelAtribuido = comarcaResponsavelMap[comarca].responsavel;
}
```

**Para alterar responsáveis de comarcas:**
- Acesse Supabase → Editor de dados → `comarca_responsaveis`
- Edite/adicione comarcas e seus responsáveis
- Salve automaticamente

---

### 2️⃣ NOTIFICAÇÕES WINDOWS AUTOMÁTICAS

**O que faz:**
- Quando novo processo é criado, notificação aparece no Windows para o responsável designado
- Contém: Comarca, Nº Process, Nome da Parte
- Automática e não-intrusiva

**Como funciona:**
```javascript
// No hub_subsidios.html - linha ~1175
const { ipcRenderer } = require('electron');
await ipcRenderer.invoke('show-notification', {
    title: '🔔 Novo Subsídio Trabalhista',
    body: `Comarca: ${comarca}\nNº: ${processo}\nParte: ${nomeParte}`
});
```

**Requisitos:**
- App já está rodando (EXTRATJUD aberto)
- Windows configurado para receber notificações da aplicação

---

### 3️⃣ RELATÓRIO SEMANAL — Nova Aba

**O que faz:**
- Nova aba "Semanal" no hub mostrando KPIs da semana atual
- Recebidos, Em Andamento, Concluídos, Pendentes, Atrasados
- Tabela com lista de processos criados esta semana
- Distribuição por responsável

**Como acessar:**
1. Abra EXTRATJUD → Subsídios Trabalhistas
2. Clique na aba **"Semanal"** (ícone calendário)
3. Veja KPIs e tabela de processos da semana

**Dados mostrados:**
- **Recebidos esta semana:** Processos com status "Novo"
- **Iniciados esta semana:** Processos em "Em Análise" ou "Em Andamento"
- **Concluídos esta semana:** Processos com status "Concluído"
- **Pendentes de info:** Status "Pendente Info"
- **Atrasados:** Com prazo vencido

---

### 4️⃣ EMAIL DE CONFIRMAÇÃO AUTOMÁTICA

**O que faz:**
- Quando processo é criado, email automático é enviado para o solicitante
- Contém: Nº processo, Parte, Comarca, Data, Status
- Template HTML profissional

**Como funciona:**
```javascript
// No hub_subsidios.html - linha ~1190
await ipcRenderer.invoke('send-email', {
    to: currentUser.email,
    subject: `Subsídio Registrado: ${processo}`,
    html: htmlEmail
});
```

**Status:**
- ✅ Código implementado
- ⏳ Requer configuração de SendGrid (chave API)
- 📝 Por enquanto, logs apenas em console do Electron

**Para ativar emails de verdade:**
1. Obtenha chave SendGrid: https://sendgrid.com
2. Adicione ao `main.js` (busque "send-email handler"):
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({...});
```

---

### 5️⃣ DINÂMICA DE PERMISSÕES

**O que faz:**
- **Jurídico:** Vê todos os processos
- **Outras áreas:** Veem apenas seus próprios processos criados + que pertencem à sua área
- Transparente — não precisa fazer nada

**Como funciona:**
```javascript
// No hub_subsidios.html - linha ~1330
const isJuridico = currentUser.email.includes('juridico') || 
                   currentUser.email.includes('antonio') ||
                   currentUser.email.includes('iane');

if (!isJuridico) {
    // Filtrar apenas processos do usuário/área
    allData = allData.filter(item => 
        item.user_id === currentUser.id || 
        item.area_origem.includes(userArea)
    );
}
```

**Teste:**
- Abra com usuário jurídico → vê tudo
- Abra com usuário RH → vê apenas RH

---

## 🔧 MAPEAMENTO DE COMARCAS PADRÃO

Inseridas automaticamente pela migração (edite em Supabase se necessário):

| Comarca | Responsável |
|---------|---|
| Salvador | Antonio Fernando |
| Camaçari | Antonio Fernando |
| Feira de Santana | Iane Naira |
| Vitória da Conquista | Iane Naira |
| Ilhéus | Iane Naira |
| Jequié | Antonio Fernando |
| Barreiras | Antonio Fernando |

**Para adicionar mais:**
1. Supabase → `comarca_responsaveis` table
2. Insert nova linha com a comarca e responsável
3. Automático no próximo reload

---

## 📋 CHECKLIST DE IMPLANTAÇÃO

- [ ] **Executa migração SQL** (`004_comarca_responsaveis.sql`)
- [ ] **Testa auto-atribuição** — Cria novo processo, vê se responsável é atribuído
- [ ] **Testa notificação** — Vê se notificação Windows aparece
- [ ] **Testa relatório semanal** — Clica aba "Semanal", vê dados
- [ ] **Testa email** — Cria processo, vê se email chegou (quando configurado)
- [ ] **Testa permissões** — Acessa com diferentes usuários
- [ ] **Testa exportação** — Exporta dados em Excel (já funcionava)

---

## ❓ PERGUNTAS FREQUENTES

### P: Nada aparece no relatório semanal
**R:** Precisa ter processos criados nas últimas 7 dias. Crie um processo de teste.

### P: Email não envia
**R:** Está em mock (console.log apenas). Veja instruções "Para ativar emails de verdade" acima.

### P: Como altero o responsável de uma comarca?
**R:** Supabase → `comarca_responsaveis` → edita linha desejada

### P: Notificação não aparece
**R:** Verifique se Windows tem permissão para notificações da app. Tente reabrir o EXTRATJUD.

---

## 🎯 PRÓXIMOS PASSOS (Não Implementado)

- [ ] Formulário web público para solicitantes (sem autenticação)
- [ ] Criação automática de pastas no SharePoint por CPF
- [ ] Integração com email corporativo para confirmação
- [ ] Dashboard de relatórios semanais por email

---

**Desenvolvido por:** João Guilherme Almeida Viana  
**Última atualização:** 16/03/2026 23:30
