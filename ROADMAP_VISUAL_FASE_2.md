# 🎯 ROADMAP VISUAL — Subsídios Trabalhistas Fase 2

**Gerado:** 17 de Março de 2026 | **Status:** Pronto para Implementação

---

## 📌 VISÃO GERAL

```
HOJE                           SEMANA 1                    SEMANA 2
[70% Pronto]  ──────────> [90% Pronto]  ──────────> [95% Pronto]
                CRÍTICO          IMPORTANTE          FUTURO
             
✅ Dashboard    ✅ Permissões     ✅ Audit Trail     ⏳ Formulário Web
✅ Exportação   ✅ Notif. Avançada
✅ Filtros      ✅ Relatório      ✅ Calendário
✅ SharePoint   ✅ Email Auto
               ✅ Validação CPF
               ✅ SLA Dashboard
```

---

## 🔴 FASE 1 — CRÍTICO (Semana 1 | ~15 horas)

### 1️⃣ Permissões por Role (3h) — SEGURANÇA
```
ANTES                      DEPOIS
┌─────────────────────┐   ┌──────────────────────────┐
│ RH vê tudo          │   │ RH vê: Seus pedidos      │ ✅
│ GSS vê tudo         │   │ GSS vê: Seus pedidos     │ ✅
│ Jurídico vê tudo ✅ │   │ Jurídico vê: TUDO ✅     │
│ Bodas vê tudo ❌    │   │ Bodas vê: TUDO (R/O) ✅  │
└─────────────────────┘   └──────────────────────────┘
```

**Localização:** `hub_subsidios.html` ~linha 2100  
**Arquivos:** `loadProcessos()` → Adicionar filtro por role  
**Teste:** Login como RH → Só ver pedidos de RH  

---

### 2️⃣ Notificações Avançadas (2h) — OPERACIONAL
```
CENÁRIO: Processo está em "Em Análise" há 6 dias...
         Prazo é em 2 dias... Status muda para "Crítico"

ANTES: Sem notificação ❌
DEPOIS: 
  ┌─────────────────────────────┐
  │ ⚠️ PROCESSO CRÍTICO         │
  │                             │
  │ João da Silva               │
  │ Comarca: Salvador           │
  │ Status: CRÍTICO             │
  │ Prazo: 2 dias restantes     │
  └─────────────────────────────┘ ✅
```

**Localização:** `hub_subsidios.html` ~linha 2050  
**Dispara quando:** Status muda para "Crítico", "Atrasado", "Vencido"  
**Teste:** Atualizar status → Notificação aparece  

---

### 3️⃣ Relatório Semanal Completo (4h) — VISIBILIDADE
```
EXTENSÃO DA ABA JÁ EXISTENTE

┌─ SEMANAL ────────────────────────────────┐
│                                          │
│ 📊 KPIs DA SEMANA                       │
│ ┌──────────┬──────────┬──────────┐      │
│ │ 8 Novos  │ 5 Inicia │ 3 Concl. │      │
│ │ Pedidos  │ dos      │ uídos    │      │
│ └──────────┴──────────┴──────────┘      │
│                                          │
│ 📋 Processos da Semana                  │
│ ┌─────────────────────────────────┐    │
│ │ Nº   │ Parte    │ Status  │ Resp │    │
│ ├─────────────────────────────────┤    │
│ │ 001  │ João     │ Novo    │ Anto │    │
│ │ 002  │ Maria    │ Análise │ Iane │    │
│ │ 003  │ Pedro    │ Concl.  │ Anto │    │
│ └─────────────────────────────────┘    │
│                                          │
│ [📥 Exportar em Excel]                 │
│                                          │
└──────────────────────────────────────────┘
```

**Localização:** Aba "Semanal" já existe, completar:  
  - [ ] Tabela com lista de processos da semana
  - [ ] Filtro por responsável
  - [ ] Botão exportar Excel
  - [ ] Destaques de atrasados

**Teste:** Abrir aba Semanal → Ver dados + exportar  

---

### 4️⃣ Email de Confirmação (2h) — EXPERIÊNCIA
```
FLUXO:
┌─────────────────┐
│ Novo processo   │
│ criado          │ ────────→ Sistema envia email
└─────────────────┘
                        ┌────────────────────┐
                        │ EMAIL CONFIRMAÇÃO  │
                        │                    │
                        │ Olá João,          │
                        │ Seu pedido foi     │
                        │ recebido!          │
                        │                    │
                        │ Nº: 12345          │
                        │ Prazo: 30 dias     │
                        │                    │
                        │ Jurídico Trab.     │
                        └────────────────────┘
```

**Localização:** `hub_subsidios.html` ~linha 1945  
**Requer:** Backend com SendGrid/SMTP  
**Teste:** Criar processo → Verificar caixa de email  

---

### 5️⃣ Validação CPF (30min) — QUALIDADE
```
ANTES
┌──────────────────┐
│ CPF: XYZ123      │ ❌ Inválido, aceita
└──────────────────┘

DEPOIS
┌──────────────────┐
│ CPF: 12345678901 │ ✅ Válido
│                  │
│ CPF: XYZ123      │ ❌ Erro: CPF inválido!
└──────────────────┘
```

**Localização:** `hub_subsidios.html` ~linha 1800  
**Função:** `validarCPF(cpf)` com dígito verificador  
**Teste:** Tentar salvar com CPF inválido → Erro  

---

### 6️⃣ Dashboard de SLA (2h) — MONITORAMENTO
```
CARD NO DASHBOARD

┌─ STATUS DE PRAZOS ──────────────────┐
│                                     │
│  🔴 2 VENCIDOS                      │
│     └─ João Silva (Salvador)        │
│     └─ Maria Santos (Brasília)      │
│                                     │
│  🟡 5 CRÍTICOS (< 3 dias)          │
│     └─ Pedro Costa (Recife)         │
│     └─ Ana Paula (São Paulo)        │
│     ...                             │
│                                     │
│  🟢 18 OK                           │
│                                     │
│  [Ver Detalhe]                      │
│                                     │
└─────────────────────────────────────┘
```

**Localização:** Dashboard principal  
**Func:** `calcularSLA()` compara prazo vs hoje  
**Teste:** Criar processo com prazo próximo → Ver em SLA crítico  

---

## 🟡 FASE 2 — IMPORTANTE (Semana 2 | ~7 horas)

### 7️⃣ Histórico de Alterações (3h)
```
"Quem alterou o quê e quando?"

╔════════════════════════════════════════╗
║ HISTÓRICO DO PROCESSO #001             ║
╠════════════════════════════════════════╣
║ 15/03/2026 14:30 | Antonio F.          ║
║ Status: Novo → Em Análise               ║
║                                        ║
║ 16/03/2026 09:15 | Iane Naira          ║
║ Status: Em Análise → Pendente Info      ║
║                                        ║
║ 17/03/2026 11:00 | Antonio F.          ║
║ Status: Pendente Info → Em Andamento    ║
╚════════════════════════════════════════╝
```

**Novo campo:** Tabela `subsidios_audit_log`
**Benefício:** Auditoria, compliance, rastreabilidade

---

### 8️⃣ Calendário de Prazos (4h)
```
                  MARÇO 2026
  Dom  Seg  Ter  Qua  Qui  Sex  Sab
                                1   2
   3    4    5    6    7    8    9
       [CRÍTICO]
       João Silva
      10   11   12   13   14   15   16
      [OK]  [OK] [CRÍTICO]
                  Pedro Costa
      17   18   19   20   21   22   23
      [VENCIDO] 
      Ana Paula
      ...
```

**Biblioteca:** FullCalendar.js  
**Cores:**
- 🔴 Red = Vencido/Crítico
- 🟡 Orange = < 7 dias
- 🟢 Green = OK

---

## ⏳ FASE 3 — FUTURO (>2 semanas)

### 9️⃣ Formulário Web Público (12h)
```
URL: https://extratjud.empresa.com.br/solicitar-subsidio

┌────────────────────────────────┐
│  SOLICITAÇÃO DE SUBSÍDIO       │
├────────────────────────────────┤
│                                │
│ Seu Nome *                     │
│ [_____________________]        │
│                                │
│ Email *                        │
│ [_____________________]        │
│                                │
│ Área *                         │
│ [RH ▼]                         │
│                                │
│ CPF/CNPJ                       │
│ [_____________________]        │
│                                │
│ Nome da Parte                  │
│ [_____________________]        │
│                                │
│ Comarca *                      │
│ [Salvador ▼]                   │
│                                │
│ Descrição                      │
│ [__________________________]   │
│ [__________________________]   │
│                                │
│ [❌ Limpar]  [✅ Enviar]       │
│                                │
└────────────────────────────────┘

Após enviar:
✅ "Pedido registrado! Você receberá email de confirmação."
```

**Status:** Fase 2, não crítico ainda

---

## 📊 TIMELINE DETALHADA

```
┌────────────────────────────────────────────────────────┐
│ SEG  TER  QUA  QUI  SEX  SAB  DOM                      │
│                                                        │
│ SEMANA 1 (Semana que vem)                             │
│ ┌──────────────────────────────────────┐              │
│ │ 🔴 Permissões (3h)        [##---]    │              │
│ │ 🔴 Notif. Avançada (2h)   [###--]    │              │
│ │ 🔴 Relatório Semanal (4h) [####-]    │              │
│ │ 🔴 Email Auto (2h)        [###--]    │              │
│ │ 🔴 Validação CPF (30min)  [#-----]   │              │
│ │ 🔴 SLA Dashboard (2h)     [###--]    │              │
│ └──────────────────────────────────────┘              │
│ Total: ~14 horas = 2 dias intensos                    │
│                                                        │
│ SEMANA 2 (2 semanas depois)                            │
│ ┌──────────────────────────────────────┐              │
│ │ 🟡 Audit Trail (3h)      [###---]    │              │
│ │ 🟡 Calendário (4h)       [####--]    │              │
│ └──────────────────────────────────────┘              │
│ Total: ~7 horas = 1 dia                               │
│                                                        │
│ TESTE & DEPLOY (3 dias depois)                         │
│ ┌──────────────────────────────────────┐              │
│ │ Testes com Jurídico                  │              │
│ │ Ajustes finais                       │              │
│ │ Treino de usuários                   │              │
│ │ Go live! 🚀                          │              │
│ └──────────────────────────────────────┘              │
│                                                        │
└────────────────────────────────────────────────────────┘

TOTAL DEDICADO: ~21 horas = 3 dias trabalhando
MELHOR FORMATO: Dois sprints de 1-2 dias cada
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

### ☐ FASE 1 CRÍTICA
- [ ] **Permissões por Role** → Modificar `loadProcessos()`
- [ ] **Notif. Avançadas** → Adicionar trigger ao atualizar status
- [ ] **Relatório Semanal** → Completar aba (tabela + export)
- [ ] **Email Auto** → Integrar SendGrid no backend
- [ ] **Validação CPF** → Função `validarCPF()`
- [ ] **SLA Dashboard** → Calcular e exibir status SLA

### ☐ FASE 2 IMPORTANTE
- [ ] **Audit Trail** → Criar tabela + função de log
- [ ] **Calendário** → Integrar FullCalendar.js + renderizar

### ☐ TESTES
- [ ] Testar cada funcionalidade com dados reais
- [ ] Verificar com jurídico (Antonio + Iane)
- [ ] Validar permissões (RH, GSS, JURIDICO não veem dados misto)
- [ ] Validar emails (chegam corretos)
- [ ] Validar notificações (aparecem no Windows)

### ☐ DEPLOY
- [ ] Fazer backup Supabase
- [ ] Deploy em produção
- [ ] Atualizar documentação
- [ ] Treinar usuários

---

## 💡 DICAS DE IMPLEMENTAÇÃO

1. **Começar por Permissões** — É o alicerce, faz você se sentir seguro
2. **Depois Notificações** — Visível, rápido retorno
3. **Depois Dashboard SLA** — Quick win, evita problemas
4. **Por último Emails** — Depende de backend, mais lento

---

## 🔗 RECURSOS

| Recurso | Link | Notas |
|---------|------|-------|
| **Análise Completa** | `ANALISE_REQUISITOS_E_MELHORIAS.md` | Leitura aprofundada |
| **Requisitos Originais** | `docs/LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.md` | O que foi pedido |
| **Compliance** | `COMPLIANCE_REQUISITOS.md` | Checklist detalhado |
| **Código** | `public/hub_subsidios.html` | Onde editar |
| **BD** | Supabase Console | Tabelas e dados |

---

## 💬 PRÓXIMOS PASSOS

1. **Hoje/Amanhã:** Ler este documento
2. **Esta semana:** Implementar Fase 1 (15 horas)
3. **Próxima semana:** Implementar Fase 2 (7 horas)
4. **Semana depois:** Testes + deploy

**STATUS:** Apronto para começar!

---

**Documento gerado:** 17/03/2026  
**Versão:** 1.0 Final  
**Prioridade:** 🔴 ALTA — Implementar ASAP
