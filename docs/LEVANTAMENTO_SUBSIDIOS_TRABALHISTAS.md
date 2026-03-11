# Levantamento de Requisitos — Subsídios Trabalhistas
**Projeto:** EXTRATJUD — Módulo de Gestão de Subsídios Trabalhistas
**Data:** Março de 2026
**Elaborado por:** João Guilherme Almeida Viana — Jurídico Contencioso Cível

---

## 1. Contexto — O Problema Atual

Hoje, quando alguém precisa enviar documentos ou pedidos (subsídios) para o setor jurídico trabalhista, o processo funciona assim:

1. A pessoa escreve um e-mail e envia para o responsável do jurídico
2. O e-mail chega na caixa de entrada pessoal do advogado ou analista responsável
3. Essa pessoa precisa ler, classificar e dar andamento ao pedido manualmente

**Isso gera os seguintes problemas:**

- 📥 **Acúmulo de e-mails:** a caixa de entrada fica sobrecarregada com dezenas de pedidos misturados com outros e-mails pessoais e profissionais, tornando difícil encontrar o que importa
- 🏖️ **Risco de perda por ausência:** se a pessoa responsável estiver de férias, afastada ou em licença, o pedido pode ficar perdido na caixa de entrada por dias ou semanas sem que ninguém tome providências
- 👤 **Dependência de uma única pessoa:** tudo depende de uma só pessoa verificar e-mails constantemente
- 📂 **Falta de histórico centralizado:** não há um lugar único onde todos possam ver quais pedidos foram feitos, quais estão em andamento e quais já foram resolvidos
- ⏱️ **Sem controle de prazo:** não há como saber facilmente se um pedido está atrasado ou urgente sem ler cada e-mail individualmente

---

## 2. O Que Queremos Resolver

O objetivo é criar um **canal organizado e centralizado** para recebimento dos pedidos de subsídios, de forma que:

- Qualquer pedido enviado fique registrado em um **único lugar acessível pela equipe toda**, não em e-mails pessoais
- Mesmo se a pessoa responsável estiver ausente, qualquer outro membro da equipe possa ver e tratar o pedido
- Exista um histórico claro de cada pedido: quando foi feito, por quem, qual o prazo, em que situação está
- O processo seja **simples para quem envia** (a pessoa não precisa instalar nenhum programa)

---

## 3. Como Funcionaria na Prática

### Caminho proposto

```
Pessoa da empresa preenche um formulário 
        ↓
O pedido vai automaticamente para uma pasta no SharePoint
        ↓
O jurídico recebe uma notificação no Teams ou por e-mail
        ↓
O analista responsável abre o EXTRATJUD e vê todos os pedidos organizados
        ↓
Atualiza o status (Em Análise, Em Andamento, Concluído...) conforme avança
```

### Como a pessoa que envia usa o sistema

A pessoa que envia o pedido não precisa instalar nada. Ela recebe um **link** (por e-mail ou Teams) que abre um formulário no navegador. Ela preenche as informações necessárias e clica em "Enviar". Pronto.

O formulário perguntaria apenas o que for essencial, por exemplo:
- Nome completo e área
- Número do processo (se houver)
- Tipo de documento que está enviando
- Prazo (se houver um prazo específico)
- Observações ou descrição do pedido

Após enviar, o pedido aparece automaticamente na pasta do SharePoint e no sistema do EXTRATJUD para o jurídico acompanhar.

### Como o jurídico usa o sistema

Após receber a notificação, o analista abre o EXTRATJUD no computador e vê uma lista com todos os pedidos recebidos. Ele pode:
- Filtrar por status, área ou prazo
- Clicar em um pedido para ver todos os detalhes
- Atualizar o status (ex: "Em Andamento", "Aguardando Documentos", "Concluído")
- Ver um painel resumido mostrando quantos pedidos estão em aberto, atrasados ou concluídos

---

## 4. O Que Acontece com os E-mails Atuais

Existem duas abordagens possíveis, e precisamos entender com a equipe qual faz mais sentido:

### Opção A — Manter o e-mail, mas criar o formulário como canal principal
Os e-mails continuam existindo normalmente. A equipe passa a **orientar os remetentes** a usar o formulário em vez de enviar e-mail. Com o tempo, os pedidos migram naturalmente para o novo sistema. Não há impacto imediato na forma como as pessoas trabalham.

**Vantagem:** sem impacto operacional imediato, mudança gradual
**Desvantagem:** nos primeiros meses, pedidos podem continuar chegando por e-mail e pelo formulário ao mesmo tempo, gerando duplicidade

---

### Opção B — Monitorar automaticamente os e-mails e mover para o sistema
O EXTRATJUD ficaria verificando a caixa de entrada automaticamente. Quando chegasse um e-mail identificado como pedido de subsídio, ele seria registrado no sistema e removido do e-mail.

**Vantagem:** transição automática, sem precisar mudar o hábito de quem envia
**Desvantagem:** requer autorização especial do setor de TI da empresa para acessar as caixas de e-mail corporativas; mais complexo de implementar e manter; risco de identificar erroneamente um e-mail comum como pedido

---

**Nossa recomendação inicial é a Opção A**, por ser mais segura, mais simples e não depender de aprovações de TI. A Opção B pode ser avaliada em uma segunda etapa, se a equipe sentir necessidade.

---

## 5. Perguntas para Alinhamento

Para que possamos construir o sistema da forma certa, precisamos que a equipe responda as seguintes perguntas:

### Sobre quem envia os pedidos
1. Quais áreas ou setores da empresa costumam enviar esses pedidos? (Ex: RH, Operações, Facilities...)
2. Quantos pedidos, em média, são recebidos por semana?
3. Essas pessoas têm acesso ao SharePoint hoje? Conseguem abrir links do Teams?
4. Existe alguma urgência específica (pedidos que precisam de resposta em menos de 24h)?

### Sobre o conteúdo dos pedidos
5. Além do número do processo e tipo de documento, quais outras informações são importantes constar no pedido?
6. Os pedidos geralmente vêm acompanhados de arquivos (documentos, PDFs)? Se sim, qual o tamanho máximo esperado?
7. Há alguma categorização específica que a equipe usa hoje (ex: por tipo de ação trabalhista, por comarca, por empresa contratada)?

### Sobre o processo interno do jurídico
8. Quando um pedido chega, quem é o primeiro a receber e tratar? É sempre a mesma pessoa ou qualquer membro da equipe pode assumir?
9. Como é decidido quem fica responsável por cada pedido? É por rodízio, por especialidade, por demanda?
10. O grupo gostaria de receber uma **notificação no Microsoft Teams** quando chegasse um novo pedido? Ou prefere verificar no sistema periodicamente?
11. É necessário que o sistema envie uma **confirmação automática** para quem enviou o pedido ("Seu pedido foi recebido e será analisado em breve")?
12. Existe necessidade de **relatórios periódicos** (ex: relatório semanal de pedidos recebidos, em andamento e concluídos)?

### Sobre o SharePoint
13. A pasta de Subsídios no SharePoint já está organizada de alguma forma? Existe uma estrutura de subpastas por tipo, ano ou área?
14. Além da equipe do jurídico trabalhista, outras pessoas precisam ter acesso para visualizar os pedidos no SharePoint?

### Sobre segurança e acesso
15. Quem pode **ver** todos os pedidos? Somente o jurídico, ou também quem enviou consegue acompanhar o status do próprio pedido?
16. Há necessidade de **sigilo** em algum tipo de pedido (ex: pedidos que somente o advogado responsável pode ver)?

---

## 6. O Que Já Está Pronto

Para que a equipe tenha noção do que já foi desenvolvido, o EXTRATJUD já conta com:

✅ Um módulo de "Subsídios Trabalhistas" com cadastro de processos, listagem com filtros e painel de acompanhamento
✅ Integração com banco de dados para armazenamento dos pedidos
✅ Botão de acesso direto à pasta de Subsídios no SharePoint (`JUD-GERNCIACOELBA`)
✅ Controle de status por processo (Novo, Em Análise, Em Andamento, Aguardando Documentos, Concluído, Cancelado)
✅ Painel com indicadores: total de processos, em andamento, com prazo vencido, aguardando documentos
✅ Alerta automático dos processos com prazo nos próximos 7 dias

O que falta construir depende das respostas acima, principalmente: o formulário para quem envia, e a integração automática com o SharePoint e/ou Teams.

---

## 7. Próximos Passos Sugeridos

| # | Ação | Responsável |
|---|------|-------------|
| 1 | Reunião de alinhamento para responder as perguntas acima | Jurídico + João Guilherme |
| 2 | Validar o layout do formulário que quem envia vai preencher | Jurídico |
| 3 | Definir se a notificação será por Teams ou e-mail | Jurídico |
| 4 | Verificar permissões no SharePoint para o novo fluxo | TI / Jurídico |
| 5 | Desenvolvimento e testes do formulário e integração | João Guilherme |
| 6 | Treinamento da equipe e divulgação do novo canal | Jurídico |

---

*Este documento é um rascunho de levantamento e está aberto a ajustes conforme as discussões com a equipe.*
