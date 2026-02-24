# Planejamento Futuro: PJE API & 2FA

## 1. Autenticação 2FA (Prioridade Alta)
- **Problema**: O login no PJE exige código de autenticação (TOTP) que muda a cada 30s.
- **Solução Técnica**: Usar a biblioteca `otplib`.
- **Requisito**: Obter a "Secret Key" (chave base em texto) do autenticador de quem possui o acesso.
- **Implementação**:
    1. Instalar `npm install otplib`
    2. Criar script que recebe a Secret Key e gera o token atual.
    3. Integrar no robô de login para preencher o campo automaticamente.

## 2. API "Escondida" do PJE
- **Objetivo**: Substituir navegação lenta (Selenium/Playwright) por chamadas HTTP diretas (fetch/axios).
- **Estratégia**:
    1. Usar script de interceptação (Network Sniffer) durante a navegação manual.
    2. Analisar se as respostas são JSON (API REST) ou HTML/XML (JSF/ViewState).
    3. Se for JSON: Implementar cliente HTTP.
    4. Se for HTML/ViewState: Manter automação via browser, mas otimizar seletores.
