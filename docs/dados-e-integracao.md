# Seletores, massa de dados e integração com a API

> Ver [`../AGENTES.md`](../AGENTES.md) para o resumo acionável destas regras.

## Estratégia de seletores

**Decisão:** o padrão-alvo é `data-testid` (não `data-cy` — nome neutro em
relação à ferramenta de teste). A implementação está começando no
`we-party-web-app`; não é um esforço único de migração, a cobertura cresce
junto com os testes: ao tocar em um componente para dar suporte a um teste
novo, adiciona-se o `data-testid` correspondente naquele momento.

Ordem de prioridade:
1. `data-testid="..."` — padrão-alvo.
2. `id` semântico e estável — aceitável enquanto o componente ainda não tem
   `data-testid` (ex.: `#email`, `#password`).
3. Atributos ARIA / texto visível (`cy.contains`).
4. **Nunca** classes puramente visuais (`.btn-primary`, `.eye-button`) ou
   de estado (`.has-error`) — mudam com qualquer ajuste de CSS/design.

Seletor sempre centralizado no Page Object correspondente (nunca direto no
`it`), via o comando `cy.getBySel(nome)` (resolve para
`[data-testid=nome]`).

## Massa de dados de teste

Uma única fonte por tipo de dado — `cy.fixture('users/credentials')` para
usuário de teste válido. Nenhuma credencial literal dentro de um `.cy.js`.
`docs/massa-de-teste.md` continua como documentação legível por humanos
(não versionada), mas os specs leem das fixtures, não duplicam os valores.

## Mocks (`cy.intercept`) vs. API real

**Decisão:** o `cypress.config.js` aponta `baseUrl` para **produção**
(`https://www.wepartyapp.com`) e isso continua assim — hoje existe apenas
um único ambiente disponível. Quando existir staging, revisitar esta
decisão.

Justamente por só existir produção, `cy.intercept` deixa de ser só boa
prática e vira a principal proteção contra efeito colateral real:

- Validação de formulário (campo vazio, etc.) não depende de API — a
  validação client-side barra o submit antes de qualquer chamada.
- Todo cenário que dependeria de uma chamada real que altera estado (login,
  cadastro, alteração de dados) **deve mockar via `cy.intercept`**, com
  fixture de resposta em `fixtures/api/`.
- Alias nomeado pelo recurso, nunca genérico: `@loginRequest`, não `@req1`.
- Um cenário que só pode ser testado de forma realista contra API real
  (não mockável) é motivo para reabrir a discussão sobre ambiente de
  staging.
