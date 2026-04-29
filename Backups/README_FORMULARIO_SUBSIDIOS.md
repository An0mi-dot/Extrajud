# Formulário de Solicitação de Subsídios Trabalhistas

## Descrição
O **Formulário de Subsídios** (`formulario_subsidios.html`) era a interface de coleta de dados para solicitações de subsídios trabalhistas. Funcionava como portão de entrada do fluxo de subsídios, capturando informações do solicitante e documentação comprobatória.

## Funcionalidades
- **Preenchimento de Dados Pessoais**: Nome, CPF, dados bancários
- **Seleção de Tipo de Subsídio**: Dropdown com categorias disponíveis
- **Upload de Documentos**: Drag-and-drop para anexar comprovantes (PDF, imagens)
- **Validação em Tempo Real**: CPF, email, documentação obrigatória
- **Integração Supabase**: Armazenamento imediato de dados capturados
- **Sincronização SharePoint**: Envio automático de anexos para armazenamento corporativo
- **Notificações**: Alerta por email de confirmação de recebimento

## Estrutura do Formulário
```html
- Seção de Identificação
  ├─ Nome Completo
  ├─ CPF (com validação e máscara)
  ├─ Email corporativo
  └─ Telefone

- Seção de Subsídio
  ├─ Tipo de Subsídio (dropdown)
  ├─ Data de Início Solicitado
  ├─ Valor Estimado
  └─ Justificativa

- Seção de Documentação
  ├─ Upload de Documentos (múltiplos)
  ├─ Visualização de Arquivos Enviados
  └─ Remoção de Attachments Selecionados

- Seção de Banco de Dados
  ├─ Banco Favorito
  ├─ Agência
  ├─ Conta
  └─ Tipo de Conta
```

## Fluxo de Processamento
1. **Preenchimento**: Usuário completa o formulário
2. **Validação Local**: Verificação de campos obrigatórios
3. **Upload Supabase**: Envio de dados para tabela `subsidios_trabalhistas`
4. **Upload SharePoint**: Sincronização de documentos para pasta corporativa
5. **Notificação**: Email automático enviado ao responsável
6. **Rastreamento**: ID único gerado para acompanhamento

## Validações Implementadas
- **CPF**: Algoritmo de verificação de dígito (válido conforme Lei Federal)
- **Email**: Validação de domínio corporativo (@neoenergia.com)
- **Documentos**: Apenas PDF, JPG, PNG (limite 10MB cada)
- **Valores**: Máximo e mínimo configuráveis por tipo de subsídio
- **Data**: Não aceita datas retroativas ou futuras

## Dependências
- Supabase Client (`supabaseClient.js`)
- SharePoint Service (`sharepoint_service.js`)
- Font Awesome (ícones)
- CSS Theme (`theme.css`)

## Razão da Remoção
O formulário foi **desabilitado junto ao módulo de subsídios** para simplificação e remoção de dependência do Supabase. A reformulação do Extratjud priorizou funcionalidades de automação independentes.

## Reativação Futura
Para reativar este componente:
1. Restaurar arquivo `formulario_subsidios.html` para `public/`
2. Garantir que `supabaseClient.js` esteja funcional
3. Reativar SharePoint Integration
4. Adicionar link de acesso ao formulário (menu principal ou email direto)
5. Executar testes de validação e envio

## Campos de Dados (Schema Supabase)
```sql
CREATE TABLE subsidios_trabalhistas (
  id uuid PRIMARY KEY,
  nome_solicitante text,
  cpf text UNIQUE,
  email text,
  tipo_subsidio text,
  valor_solicitado decimal,
  data_solicitacao timestamp,
  status text,
  banco_nome text,
  agencia text,
  conta text,
  tipo_conta text
);
```

## Performance e Segurança
- Validação CSP (Content Security Policy) habilitada
- Upload seguro com verificação de MIME type
- Dados criptografados em trânsito (HTTPS)
- RLS (Row Level Security) aplicado no Supabase
- Limite de taxa (rate limiting) de 10 requisições/minuto por IP

## Última Atualização
- Data: Abril 2026
- Status: Arquivado em `/Backups/`
- Versão: 1.0 (última funcional)
- Documentação: Completa e preservada
