# Relatório de Compliance — Requisitos de Subsídios Trabalhistas
**Data:** 16 de Março de 2026  
**Status:** Análise Completa

---

## ✅ IMPLEMENTADO

### Exporte de Dados
- [x] **Exportação Excel — Subsídios** (formatado com cores, bordas, cabeçalho destacado)
- [x] **Exportação Excel — Solicitações Trabalhistas** (mesmo padrão)
- [x] Suporte a filtros de período, status, área/tipo
- [x] Formatação PT-BR com datas corretas
- [x] Arquivo salvo em Downloads automaticamente

### Interface e Dados
- [x] **Dropdown de áreas** com opções: RH, GSS, Folha, Remuneração, Organização, Plano de Saúde
- [x] **Listagem com filtros** (por data, status, área, comarca)
- [x] **Painel de KPIs** mostrando:
  - Total de solicitações
  - Em andamento / Concluídas / Atrasadas / Pendentes
  - SLA crítico abertos
  - Distribuição por tipo de subsídio
- [x] **Controle de Status** (Novo, Em Análise, Em Andamento, Aguardando Documentos, Concluído, Cancelado)
- [x] **Integração Supabase** para armazenamento de dados
- [x] **Acesso ao SharePoint** (botão direto para pasta)

### Campos Capturados (Subsídios)
- [x] Número do processo
- [x] Nome da parte
- [x] CPF
- [x] Comarca
- [x] Tipo de documento
- [x] Área
- [x] Responsável
- [x] Status
- [x] Prazo
- [x] Observações

---

## ❌ NÃO IMPLEMENTADO (Requisitos Confirmados)

### 1. **NOTIFICAÇÕES WINDOWS POR COMARCA** 🔴 ALTA PRIORIDADE
**Requisito:** "Q10 — Notificações para todos ou só responsável? Resp: Só para o responsável designado (por comarca)"

**O que precisa:**
- [ ] Mapear CPF/User ID → Comarca responsável (Antonio Fernando vs Iane Naira)
- [ ] Criar handler IPC para notificação Windows
- [ ] Disparar notificação automática quando:
  - Novo processo é criado
  - Status muda para "Crítico" ou "Atrasado"
- [ ] Apenas responsável pela comarca recebe notificação

**Impacto:** Sem isso, usuários não sabem quando há pedidos novos para eles

---

### 2. **RELATÓRIO SEMANAL NO HUB** 🔴 ALTA PRIORIDADE
**Requisito:** "Q12 — Relatórios periódicos? Resp: Sim (semanal: recebidos, em andamento, concluídos)"

**O que precisa:**
- [ ] Nova aba "Painel Semanal" no hub_subsidios.html
- [ ] KPIs mostrando:
  - Subsídios recebidos **esta semana**
  - Subsídios em andamento (quantos iniciados esta semana)
  - Subsídios concluídos **esta semana**
  - Taxa de SLA (% dentro do prazo)
- [ ] Tabela com lista de itens da semana com breakdown por compositor
- [ ] Possível: exportação automática para email toda segunda-feira

**Impacto:** Jurídico não tem visão consolidada do andamento semanal

---

### 3. **DIVISÃO POR COMARCA (RESPONSÁVEIS)** 🔴 ALTA PRIORIDADE
**Requisito:** "Q8 — Quem recebe primeiro? Resp: Antonio Fernando e Iane Naira (divisão por comarca)"

**O que precisa:**
- [ ] Campo `responsavel_comarca` na tabela `subsidios_trabalhistas`
- [ ] Mapear comarcas:
  - **Antonio Fernando:** Comarcas [lista a validar]
  - **Iane Naira:** Comarcas [lista a validar]
- [ ] Auto-atribuição ao inserir novo processo baseado na comarca
- [ ] Campo editável na interface para reatribuição manual
- [ ] Filtro "Meus processos" que mostra apenas os da comarca do usuário logado

**Impacto:** Pedidos podem ser atribuídos errado; falta clareza de responsabilidade

---

### 4. **DINÂMICA DE PERMISSÕES** 🟡 MÉDIA PRIORIDADE
**Requisito:** "Q15 — Quem vê todos os pedidos? Resp: Jurídico, áreas responsáveis, escritório parceiro (Bodas Chaves)"

**O que precisa:**
- [ ] Role-based access control (RBAC):
  - **RH, GSS, Folha, etc.:** Veem apenas seus próprios pedidos
  - **Jurídico (Subsídios):** Vê todos os pedidos
  - **Bodas Chaves:** Acesso leitura ao SharePoint (compartilhamento)
- [ ] Verificação de role no `loadProcessos()` antes de exibir
- [ ] Campo `area_origem` já existe, usar para filtro

**Alteração Supabase necessária:**
```sql
-- Adicionar campo area_origin se não estiver
ALTER TABLE subsidios_trabalhistas ADD COLUMN area_origem TEXT DEFAULT 'RH';

-- Adicionar campo responsavel se não estiver
ALTER TABLE subsidios_trabalhistas ADD COLUMN responsavel_comarca TEXT;
```

**Impacto:** RH pode ver subsídios de outro setor (sigilo)

---

### 5. **CONFIRMAÇÃO AUTOMÁTICA POR EMAIL** 🟡 MÉDIA PRIORIDADE
**Requisito:** "Q11 — Confirmação automática? Resp: Sim"

**O que precisa:**
- [ ] Detectar email do solicitante (já tem `user_email` no registro)
- [ ] Disparar email automático quando status == "Novo"
- [ ] Template do email:
  ```
  Olá [NOME],
  
  Seu pedido de subsídio foi recebido e registrado com sucesso.
  
  Nº Processo: [número]
  Data de Recebimento: [data]
  Status atual: Novo
  Prazo: [prazo]
  
  Você será notificado de qualquer atualização.
  
  Jurídico Trabalhista
  ```
- [ ] Usar SendGrid ou SMTP do servidor

**Impacto:** Solicitante não sabe se pedido foi recebido (falta feedback)

---

### 6. **COMPARTILHAMENTO COM BODAS CHAVES** 🟡 MÉDIA PRIORIDADE
**Requisito:** "Q14 — Outras pessoas com acesso? Resp: Bodas Chaves (escritório parceiro)"

**O que precisa:**
- [ ] Compartilhar pasta SharePoint com Bodas Chaves (read-only)
- [ ] No EXTRATJUD: verificar se user é "bodas.chaves@..." e exibir apenas mode leitura
- [ ] Desabilitar botões de edição/criação/exclusão para Bodas Chaves

**Impacto:** Parceiro não consegue acompanhar processos

---

### 7. **CRIAÇÃO AUTOMÁTICA DE PASTAS NO SHAREPOINT** 🟡 MÉDIA PRIORIDADE
**Requisito:** "Cada pessoa (CPF) tem pasta: `CPF — Nome da Parte`"

**O que precisa:**
- [ ] Trigger ao criar processo novo:
  ```javascript
  // Pseudo-código
  const cpf = item.cpf;
  const nome = item.nome_parte;
  const folderName = `${cpf} — ${nome}`;
  const folderPath = `Subsídios/${folderName}/`;
  
  // Criar pasta no SharePoint se não existir
  if (!sharepoint.folder(folderPath).exists()) {
    sharepoint.createFolder(folderPath);
  }
  ```
- [ ] Integração com Graph API do SharePoint
- [ ] Trata duplicatas (mesmo CPF, nome variado) → pasta única

**Impacto:** Documentos não agrupados por pessoa; auditorias complicadas

---

### 8. **FORMULÁRIO WEB PARA SOLICITANTES** 🟠 BAIXA PRIORIDADE (Fase 2)
**Requisito:** Pessoas enviam pedidos via formulário web (não por email)

**O que precisa:**
- [ ] URL pública com formulário simples (sem autenticação)
- [ ] Campos: Nome, Email, Área, Tipo, CPF, Nome da Parte, Comarca, Observações
- [ ] Envio cria registro automático em `subsidios_trabalhistas`
- [ ] Confirmação visual: "Pedido recebido! Você será acompanhado em breve."
- [ ] Verificação anti-spam (honeypot, rate limit)

**Impacto:** Ainda dependendo de email manual; sem centralização total

---

## 🎯 RECOMENDAÇÃO DE PRIORIZAÇÃO

### **FASE 1 — CRÍTICO (Esta semana)**
1. ✅ Exportação Excel (DONE!)
2. **Divisão por comarca + auto-atribuição** (5h)
3. **Notificações Windows por responsável** (4h)
4. **Relatório Semanal** (6h)

### **FASE 2 — IMPORTANTE (Próximas 2 semanas)**
5. **Dinâmica de permissões** (3h)
6. **Confirmação automática por email** (2h)
7. **Criação automática de pastas SharePoint** (8h)

### **FASE 3 — DESEJÁVEL (Próximo mês)**
8. **Formulário web público** (12h)

---

## 📊 CHECKLIST FINAL

| Funcionalidade | Status | Prioridade | Tempo Est. |
|---|---|---|---|
| Exportação Excel | ✅ | - | - |
| KPIs/Dashboard | ✅ | - | - |
| Filtros | ✅ | - | - |
| Notificações Windows | ❌ | 🔴 | 4h |
| Relatório Semanal | ❌ | 🔴 | 6h |
| Divisão por Comarca | ❌ | 🔴 | 5h |
| Permissões por Role | ❌ | 🟡 | 3h |
| Email Automático | ❌ | 🟡 | 2h |
| SharePoint Automático | ❌ | 🟡 | 8h |
| Formulário Web | ❌ | 🟠 | 12h |
| **TOTAL (Fases 1+2)** | **2/7** | - | **28h** |

---

**Próximos passos:** Validar prioridades com jurídico e iniciar Fase 1
