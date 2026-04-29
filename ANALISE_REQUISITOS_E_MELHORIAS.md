# 📋 Análise de Requisitos e Sugestões de Melhorias
## Módulo de Subsídios Trabalhistas — EXTRATJUD

**Data:** 17 de Março de 2026  
**Análise de:** Documentação de requisitos (PDFs + Markdown)  
**Escopo:** Módulo hub_subsidios.html  

---

## 🎯 RESUMO EXECUTIVO

O módulo de Subsídios Trabalhistas tem **70% dos requisitos implementados**. As lacunas ficam em 4 áreas críticas:

1. **Permissões por Role** — RH vê dados de GSS (violação de privacidade)
2. **Relatório Semanal** — Visão consolidada não finalizada
3. **Notificações de Status** — Não notifica quando status muda (crítico/atrasado)
4. **Email de Confirmação** — Solicitante não recebe feedback automático

**Impacto:** Jurídico consegue usar o sistema, mas com limitações operacionais sérias.

---

## ✅ O QUE JÁ ESTÁ PRONTO

| Funcionalidade | Status | Impacto |
|---|---|---|
| **Dashboard com KPIs** | ✅ | Gerentes enxergam status consolidado |
| **Exportação Excel** | ✅ | Relatórios para stakeholders |
| **Filtros avançados** | ✅ | Encontrar processos rapidamente |
| **Integração SharePoint** | ✅ | Documentos centralizados |
| **Auto-atribuição por comarca** | ✅ | Antonio vs Iane recebem correto |
| **Notificação inicial (Windows)** | ✅ | Responsável sabe de novo processo |
| **Aba Semanal** | ⚠️ ~80% | Básica; faltam detalues e refinamentos |

---

## ❌ LACUNAS CRÍTICAS (15 horas de trabalho)

### 1. 🔴 **PERMISSÕES POR ROLE — ALTO IMPACTO**
**Problema:** RH consegue ver subsídios de GSS, e vice-versa. Violação de privacidade.

**Requisito:** "Q15 — Quem vê todos os pedidos? Resp: Jurídico, áreas responsáveis (veem SÓ SEUS), escritório parceiro"

**Localização:** `hub_subsidios.html` — função `loadProcessos()` (~linha 2100)

**O que fazer:**

```javascript
// ANTES (inseguro)
async function loadProcessos() {
    const result = await supabase
        .from('subsidios_trabalhistas')
        .select('*');  // ❌ Traz TODOS
    
    // DEPOIS (seguro)
}

// DEPOIS (correto)
async function loadProcessos() {
    const user = getCurrentUser(); // Pega usuário logado
    const userRole = user.role; // "RH", "GSS", "JURIDICO", etc
    const userEmail = user.email;
    
    let query = supabase
        .from('subsidios_trabalhistas')
        .select('*');
    
    if (userRole === 'JURIDICO' || userRole === 'ADMIN') {
        // Vê TUDO
    } else if (userRole === 'BODAS_CHAVES') {
        // Vê tudo (read-only)
        query = query.eq('status', '!Rascunho'); // Exclui rascunhos
    } else {
        // RH, GSS, Folha, etc = vê SÓ seus pedidos
        query = query.eq('area_origem', userRole);
    }
    
    return query;
}
```

**Estimativa:** 3 horas

---

### 2. 🔴 **NOTIFICAÇÕES AVANÇADAS — ALTO IMPACTO**
**Problema:** Notificação só quando cria. Se status muda para "Crítico" ou "Atrasado", ninguém fica sabendo.

**Requisito Implícito:** "Notificar quando há mudança crítica"

**Localização:** `hub_subsidios.html` — ao atualizar status (~linha 2050)

**O que fazer:**

```javascript
// Ao salvar status
async function atualizarStatus(processId, novoStatus) {
    const processo = await supabase
        .from('subsidios_trabalhistas')
        .update({ status: novoStatus })
        .eq('id', processId);
    
    // ✅ NOVO: Notificar se crítico ou atrasado
    const statusCriticos = ['Crítico', 'Atrasado', 'Vencido'];
    if (statusCriticos.includes(novoStatus)) {
        const { ipcRenderer } = require('electron');
        await ipcRenderer.invoke('show-notification', {
            title: '⚠️ Processo Crítico',
            body: `${processo.nome_parte}\nStatus: ${novoStatus}`
        });
    }
}
```

**Estimativa:** 2 horas

---

### 3. 🔴 **RELATÓRIO SEMANAL — FINALIZE** (parcialmente com aba já criada)
**Problema:** Aba existe, mas faltam detalues, refinamentos, exportação e agendamento.

**O que implementar:**

#### **3a) Tabela Completa da Semana**
```html
<!-- Dentro da aba Semanal -->
<table class="table-semanal">
  <thead>
    <tr>
      <th>Nº Processo</th>
      <th>Parte</th>
      <th>Comarca</th>
      <th>Status</th>
      <th>Responsável</th>
      <th>Prazo</th>
      <th>Dias em Aberto</th>
    </tr>
  </thead>
  <tbody id="tbody-semanal"></tbody>
</table>
```

**Dados:**
- Filtrar apenas `created_at >= segunda-feira da semana`
- Agrupar por: Recebidos / Iniciados / Concluídos
- Mostrar dias em aberto (hoje - criação)
- Destacar se atrasado (prazo < hoje)

#### **3b) Exportação Semanal em Excel**
```javascript
// Botão "Exportar Semana"
async function exportarRelatorioSemanal() {
    const workbook = XLSX.utils.book_new();
    
    const dataInicioSemana = calcularSegundaFeira();
    const dataFimSemana = new Date();
    
    const processos = await supabase
        .from('subsidios_trabalhistas')
        .select('*')
        .gte('created_at', dataInicioSemana.toISOString())
        .lte('created_at', dataFimSemana.toISOString());
    
    const sheet = XLSX.utils.json_to_sheet(processos);
    XLSX.utils.book_append_sheet(workbook, sheet, "Relatório Semanal");
    XLSX.writeFile(workbook, `Relatorio_Subsidios_${dataAtual}.xlsx`);
}
```

#### **3c) Notificação Automática (Futuro)**
- Segunda-feira 08:00, enviar email com resumo semanal
- Requer: SendGrid ou SMTP configurado no backend

**Estimativa:** 4 horas (tabela + export; agendamento = fase 2)

---

### 4. 🔴 **EMAIL DE CONFIRMAÇÃO — MÉDIO IMPACTO**
**Problema:** Solicitante envia pedido e não sabe se recebeu.

**Requisito:** "Q11 — Confirmação automática? Resp: Sim"

**O que fazer:**

```javascript
// Ao criar novo processo em hub_subsidios.html
async function salvarNovoProcesso(dados) {
    // [... salvar no Supabase ...]
    
    // ✅ NOVO: Enviar email de confirmação
    await fetch('http://localhost:3000/api/enviar-confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: dados.user_email,  // Campo que já existe
            nome_parte: dados.nome_parte,
            processo_numero: dados.processo,
            data_recebimento: new Date().toLocaleDateString('pt-BR'),
            prazo: dados.prazo
        })
    });
}
```

**Template Email:**
```
Assunto: Pedido de Subsídio Recebido — Nº [NÚMERO]

Olá [NOME],

Seu pedido de subsídio foi recebido com sucesso!

─────────────────────────────────────
📌 Detalhes do Pedido
─────────────────────────────────────
Nº Processo: [NÚMERO]
Parte: [NOME PARTE]
Data de Recebimento: [DATA]
Prazo: [PRAZO se houver]
Status: Novo

─────────────────────────────────────
🔔 Próximas Etapas
─────────────────────────────────────
Seu pedido foi atribuído a [RESPONSÁVEL].
Você será notificado de qualquer atualização.

Dúvidas? Contate: juridico@empresa.com.br

Jurídico Trabalhista
```

**Estimativa:** 2 horas (requer backend com SendGrid)

---

## 🎯 RECOMENDAÇÕES ADICIONAIS (boas práticas)

### A) **Melhorar Validação de CPF**
**Problema:** Campo CPF aceita qualquer string.

```javascript
// Adicionar validação
function validarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return false;
    
    // Validação de dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        suma += parseInt(cpfLimpo[i]) * (10 - i);
    }
    let resto = soma % 11;
    if (resto < 2 && parseInt(cpfLimpo[9]) !== 0) return false;
    if (resto >= 2 && parseInt(cpfLimpo[9]) !== 11 - resto) return false;
    
    return true;
}

// Usar ao salvar
if (!validarCPF(dados.cpf)) {
    alert('CPF inválido');
    return;
}
```

**Estimativa:** 30 min

---

### B) **Dashboard de Atrasos com SLA**
**Problema:** Não há visão de qual processo está em risco.

**Implementar:**
```javascript
// Calcula SLA (dias restantes para prazo)
function calcularSLA(dataInclusao, prazo) {
    const hoje = new Date();
    const dataPrazo = new Date(prazo);
    const diasRestantes = Math.ceil((dataPrazo - hoje) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) return 'VENCIDO';
    if (diasRestantes < 3) return 'CRÍTICO';
    if (diasRestantes < 7) return 'ATENÇÃO';
    return 'OK';
}

// Filtro "Processos Críticos"
async function filtrarPorSLA() {
    const processos = await loadProcessos();
    return processos.filter(p => {
        const sla = calcularSLA(p.created_at, p.prazo);
        return ['CRÍTICO', 'VENCIDO'].includes(sla);
    });
}
```

**Card no dashboard mostrando:**
- 🔴 2 processos vencidos
- 🟡 5 processos críticos (< 3 dias)
- 🟢 18 processos ok

**Estimativa:** 2 horas

---

### C) **Histórico de Alterações (Audit Trail)**
**Problema:** Não há registro de quem alterou o quê e quando.

**Implementar:**
```sql
CREATE TABLE subsidios_audit_log (
    id UUID PRIMARY KEY,
    processo_id UUID REFERENCES subsidios_trabalhistas(id),
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    alterado_por TEXT,
    data_alteracao TIMESTAMP DEFAULT NOW()
);

-- Ao atualizar processo, também fazer INSERT nesta tabela
```

**Benefício:** Rastreabilidade para auditorias e compliance

**Estimativa:** 3 horas

---

### D) **Integração com Calendário de Prazos**
**Problema:** Usuário não vê próximos prazos vencendo.

**Implementar:**
```javascript
// Visualização timeline/calendário dos próximos 30 dias
async function carregarCalendarioPrazos() {
    const processos = await supabase
        .from('subsidios_trabalhistas')
        .select('*')
        .gte('prazo', new Date().toISOString())
        .lte('prazo', proximosMeses(30).toISOString());
    
    // Renderizar em calendário (use biblioteca como FullCalendar.js)
    processos.forEach(p => {
        calendar.addEvent({
            title: p.nome_parte,
            start: p.prazo,
            color: p.prazo < 7dias ? 'red' : 'blue'
        });
    });
}
```

**Estimativa:** 4 horas (requer library FullCalendar)

---

## 📊 PLANO DE PRIORIZAÇÃO

### **SEMANA 1 — CRÍTICO (15 horas)**
1. ✅ **Permissões por Role** (3h) → Resolve privacidade
2. ✅ **Notificações avançadas** (2h) → Responsável fica ciente
3. ✅ **Relatório Semanal completo** (4h) → Visão consolidada
4. ✅ **Email de Confirmação** (2h) → Feedback ao solicitante
5. ✅ **Validação CPF** (30min) → Qualidade de dados
6. ✅ **SLA no Dashboard** (2h) → Visão de atrasos

**Total:** ~13,5h → Viável em 2 dias com dedicação

---

### **SEMANA 2 — IMPORTANTE (4-5 horas)**
7. **Histórico de Alterações (Audit Trail)** (3h)
8. **Integração Calendário** (4h)

---

### **FASE 2 — FUTURO (>2 semanas)**
- Formulário web público para solicitantes (12h)
- Agendamento automático de relatórios (3h)
- API REST para integração (6h)

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### **Hoje:**
1. ✅ Você finalizou UI/UX (modals, layout)
2. Ler este documento com o jurídico (Antonio, Iane)

### **Esta semana:**
3. Implementar as 6 funcionalidades da Fase 1 (15h)
4. Testar com jurídico

### **Próxima semana:**
5. Implementar Fase 2
6. Treinar usuários

---

## 📝 RESUMO DE IMPACTOS

| Lacuna | Impacto Atual | Com Fix |
|---|---|---|
| Permissões | RH vê dados GSS | RH vê SÓ seus pedidos ✅ |
| Notificações | Só avisa de novo | Avisa de crítico/atrasado ✅ |
| Relatório | Sem consolidação semanal | Visão clara de andamento ✅ |
| Email | Solicitante não sabe se recebeu | Confirmação automática ✅ |
| Atrasos | Ninguém sabe de vencimento | Dashboard mostra SLA ✅ |

---

## 🔗 REFERÊNCIAS

- [Documento de Requisitos](docs/LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.md)
- [Respostas de Alinhamento](docs/RESPOSTAS_ALINHAMENTO_SUBSIDIOS.md)
- [Compliance Requisitos](COMPLIANCE_REQUISITOS.md)
- [Main Hub Subsidios](public/hub_subsidios.html)

---

**Status:** Pronto para implementação  
**Próxima revisão:** Após conclusão da Fase 1
