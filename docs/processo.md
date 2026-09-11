# Processo

> Ver [`../AGENTES.md`](../AGENTES.md) para o resumo acionável destas regras.

## Branch e commits — `✅ Decidido`

O `weparty-automation` adota a mesma convenção do `we-party-web-app`:

- **Branch:** `<tipo>/WEPARTY-<n>`, com slug opcional depois do número
  (ex.: `test/WEPARTY-110` ou `test/WEPARTY-110-cenarios-login`).
- **Commits:** Conventional Commits (`feat:`, `test:`, `fix:`, `chore:`,
  `docs:`, `refactor:`...).

Isso dá rastreabilidade cruzada entre o ticket Jira, a mudança no front e
os cenários de automação correspondentes.

## Lint e formatação — `🔲 Em aberto`

Ainda não há ESLint/Prettier configurados aqui (o `we-party-web-app` já usa
ESLint + `eslint-config-vuetify`). Proposta para quando entrar em
prioridade:

- `eslint-plugin-cypress`, para evitar antipadrões comuns (ex.: assignment
  de retorno de comando Cypress, uso incorreto de `cy.then`).
- Alinhar regras de estilo com o `we-party-web-app`, reduzindo o custo de
  transitar entre os dois repositórios.
