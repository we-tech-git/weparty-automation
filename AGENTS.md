# Agentes — WeParty Automação

Guia rápido para quem (humano ou agente de IA) for gerar, revisar ou editar
código neste repositório. As regras aqui são resumidas; a justificativa e os
exemplos de cada uma estão em `docs/`.

## Contexto

- Repositório de testes E2E (Cypress) do app
  [`we-party-web-app`](../frontend/we-party-web-app) — SPA Vue 3 + Vuetify.
- Único ambiente hoje: `baseUrl` do `cypress.config.js` aponta para
  **produção** (`wepartyapp.com`) — é decisão consciente, não descuido. Ver
  [docs/dados-e-integracao.md](docs/dados-e-integracao.md).

## Regras obrigatórias ao escrever/editar um teste

1. **AAA** — separar Arrange/Act/Assert em todo `it`.
   [docs/escrita-de-testes.md](docs/escrita-de-testes.md)
2. **Seletor:** `data-testid` sempre que existir no componente; nunca
   classe de estilo. Fallback: `id` semântico.
   [docs/dados-e-integracao.md](docs/dados-e-integracao.md)
3. **Nada de seletor/ação solta no spec** — vive no Page Object
   (`cypress/support/pages/`); fluxo reutilizado entre specs vira custom
   command (`cypress/support/commands/`).
   [docs/arquitetura-e-organizacao.md](docs/arquitetura-e-organizacao.md)
4. **Dado de teste vem de fixture** (`cypress/fixtures/`) — nunca
   credencial/senha hardcoded no spec.
   [docs/dados-e-integracao.md](docs/dados-e-integracao.md)
5. **Toda chamada de API que altera estado é mockada** via `cy.intercept`
   (a suíte roda contra produção). [docs/dados-e-integracao.md](docs/dados-e-integracao.md)
6. **Testes são independentes** — resetar storage/cookies/sessão em
   `beforeEach`; nenhum teste depende de outro ter rodado antes.
   [docs/escrita-de-testes.md](docs/escrita-de-testes.md)
7. **Sem números mágicos de timeout** — usar `support/constants/
   timeouts.js` ou o default do `cypress.config.js`.
   [docs/escrita-de-testes.md](docs/escrita-de-testes.md)
8. **Nomenclatura do `it`:** `"<CT-XXX>-<slug>: <descrição>"`, com `CT-XXX`
   vindo de [docs/massa-de-teste.md](docs/massa-de-teste.md).
   [docs/arquitetura-e-organizacao.md](docs/arquitetura-e-organizacao.md)
9. **Sem código morto** — todo Page Object/comando criado precisa ser
   usado por pelo menos um teste.
   [docs/arquitetura-e-organizacao.md](docs/arquitetura-e-organizacao.md)

## Processo

- Branch: `<tipo>/WEPARTY-<n>` (igual ao `we-party-web-app`).
- Commits: Conventional Commits.
- Detalhes: [docs/processo.md](docs/processo.md)

## Índice de documentação

| Doc | Conteúdo |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Instalação e execução |
| [docs/arquitetura-e-organizacao.md](docs/arquitetura-e-organizacao.md) | Estrutura de pastas, Page Objects, reuso, nomenclatura |
| [docs/escrita-de-testes.md](docs/escrita-de-testes.md) | AAA, independência dos testes, timeouts |
| [docs/dados-e-integracao.md](docs/dados-e-integracao.md) | Seletores, massa de dados, mocks vs. API real |
| [docs/processo.md](docs/processo.md) | Branch, commits, lint |
| [docs/ci-cd.md](docs/ci-cd.md) | Plano futuro de CI/CD (ainda não implementado) |
| [docs/massa-de-teste.md](docs/massa-de-teste.md) | Massa de dados de teste (não versionado) |

## Itens em aberto

- Quando entra ESLint/Prettier — [docs/processo.md](docs/processo.md).
- Pipeline de CI — plano registrado em [docs/ci-cd.md](docs/ci-cd.md), sem
  data para implementar.
