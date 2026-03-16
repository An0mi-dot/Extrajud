# Guia — Criar Formulário no Microsoft Forms
**Referência para criação do formulário público de Subsídios Trabalhistas**

---

## Acesso ao Microsoft Forms

1. Abra o navegador e vá em: **forms.microsoft.com**
2. Faça login com a conta corporativa Iberdrola
3. Clique em **+ Novo Formulário**

---

## Título e Descrição

- **Título:** `Envio de Subsídio Trabalhista`
- **Descrição:** `Use este formulário para enviar documentos, pedidos ou informações ao setor jurídico trabalhista. Nossa equipe irá analisar e entrar em contato se necessário.`

---

## Perguntas — Configuração Exata

### Pergunta 1 — Nome completo
| Campo | Valor |
|---|---|
| Tipo | Texto |
| Pergunta | `Nome completo` |
| Obrigatório | ✅ Sim |
| Texto de ajuda | — |

---

### Pergunta 2 — CPF
| Campo | Valor |
|---|---|
| Tipo | Texto |
| Pergunta | `CPF` |
| Obrigatório | ✅ Sim |
| Texto de ajuda | `Informe no formato 000.000.000-00` |
| Restrição | Texto longo: Não (resposta curta) |

---

### Pergunta 3 — Área / Setor
| Campo | Valor |
|---|---|
| Tipo | Texto |
| Pergunta | `Área ou setor onde você trabalha` |
| Obrigatório | ✅ Sim |
| Texto de ajuda | `Ex.: RH, Operações, Facilities, Engenharia...` |

---

### Pergunta 4 — Número do processo
| Campo | Valor |
|---|---|
| Tipo | Texto |
| Pergunta | `Número do processo (se houver)` |
| Obrigatório | ❌ Não |
| Texto de ajuda | `Deixe em branco se não souber ou não houver processo. Formato: 0000000-00.0000.0.00.0000` |

---

### Pergunta 5 — Tipo de documento
| Campo | Valor |
|---|---|
| Tipo | Opção (múltipla escolha) |
| Pergunta | `Tipo de documento que está enviando` |
| Obrigatório | ✅ Sim |
| Seleção múltipla | ❌ Não (apenas uma resposta) |

**Opções:**
1. Contestação
2. Laudo Pericial
3. Petição Inicial
4. Recurso
5. Procuração
6. Acordo / Proposta de Acordo
7. Memorando / Comunicado Interno
8. Certidão / Documento Oficial
9. Outros

---

### Pergunta 6 — Prazo
| Campo | Valor |
|---|---|
| Tipo | Data |
| Pergunta | `Prazo (se houver data limite)` |
| Obrigatório | ❌ Não |
| Texto de ajuda | `Informe a data limite para o jurídico tratar este pedido. Deixe em branco se não houver prazo definido.` |

---

### Pergunta 7 — Descrição / Observações
| Campo | Valor |
|---|---|
| Tipo | Texto |
| Pergunta | `Descrição ou observações sobre o pedido` |
| Obrigatório | ❌ Não |
| Texto longo | ✅ Sim |
| Texto de ajuda | `Descreva o pedido, o contexto, ou qualquer informação que ajude o jurídico a entender a solicitação.` |

---

### Pergunta 8 — Arquivos
| Campo | Valor |
|---|---|
| Tipo | Upload de arquivo |
| Pergunta | `Arquivos anexos (documentos, PDFs, imagens)` |
| Obrigatório | ❌ Não |
| Número máximo de arquivos | 10 |
| Tamanho máximo por arquivo | 10 MB |
| Tipos de arquivo permitidos | Qualquer arquivo **ou** especificar: PDF, Word, Excel, Imagens |

---

## Configurações do Formulário

Após criar as perguntas, clique em **"..."** (mais opções) → **Configurações**:

| Configuração | Valor |
|---|---|
| Aceitar respostas | ✅ Ativado |
| Quem pode responder | **"Qualquer pessoa pode responder"** (para acesso externo à empresa) ou **"Apenas pessoas da minha organização"** se for só uso interno |
| Confirmação | ✅ Ativar mensagem de confirmação |
| Mensagem de confirmação | `Seu pedido foi recebido pelo setor jurídico trabalhista. Nossa equipe irá analisá-lo e entrar em contato se necessário.` |
| Notificações por e-mail | ✅ Ativar para o criador do formulário |

---

## Conectar ao Power Automate (próximo passo)

Após criar o formulário, é possível conectar via **Power Automate** para que:
- Cada resposta salve automaticamente os dados em uma pasta do SharePoint (organizada por CPF)
- Uma notificação seja enviada para o canal do Teams ou para o EXTRATJUD

O fluxo no Power Automate seguiria os passos:
```
Gatilho: "Quando uma nova resposta for enviada" (Microsoft Forms)
   ↓
Ação: "Obter detalhes da resposta" (Microsoft Forms)
   ↓
Ação: "Criar pasta {CPF} — {Nome}" no SharePoint (se não existir)
   ↓
Ação: Mover arquivos anexados para a pasta criada
   ↓
Ação: Postar mensagem no canal do Teams (opcional)
```

---

## Arquivos de Referência

- **Mockup visual do formulário:** `public/formulario_subsidios.html` (pode ser visualizado abrindo no navegador)
- **Módulo no EXTRATJUD:** `public/hub_subsidios.html`
- **Levantamento de requisitos:** `docs/LEVANTAMENTO_SUBSIDIOS_TRABALHISTAS.md`
- **SQL para criar a tabela:** `docs/migrations/001_subsidios_trabalhistas.sql`
