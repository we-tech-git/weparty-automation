# Arquitetura e organização

> Ver [`../AGENTES.md`](../AGENTES.md) para o resumo acionável destas regras.

## Estrutura de pastas

Espelha os grupos de página do front (`src/pages/(public)/` /
`src/pages/(private)/`) e separa por responsabilidade — **não** o prefixo
da URL: esses grupos organizam os arquivos do front mas não aparecem na
rota (`(private)/feed.vue` vira `/feed`, não `/private/feed`; a proteção
de rota vem de `meta.requiresAuth`, não mais do path). Ver
`support/constants/routes.js` para as rotas reais.

```
cypress/
├── e2e/
│   ├── public/
│   │   ├── login.cy.js
│   │   └── signup.cy.js
│   └── private/
│       └── feed.cy.js
├── support/
│   ├── pages/              # Page Objects — ações e seletores de cada tela
│   │   └── LoginPage.js
│   ├── commands/           # cy.Commands.add, um arquivo por domínio
│   │   └── selectors.js
│   ├── constants/          # rotas, timeouts, mensagens
│   │   ├── routes.js
│   │   └── timeouts.js
│   └── e2e.js
├── fixtures/
│   ├── users/
│   │   └── credentials.json
│   └── api/
│       └── login-success.json
└── cypress.config.js
```

- 1 spec por *feature* de página, nomeado como a rota do front quando fizer
  sentido (`login.cy.js` ↔ `Login.vue`).
- Nenhum `cy.get`/seletor solto dentro do spec — sempre via Page Object ou
  custom command.
- Corpo de resposta de API mockada vira fixture em `fixtures/api/`, não
  objeto inline no spec.

## Page Objects e reuso

Cada tela tem um Page Object (`support/pages/*.js`) com métodos de ação
(`fillEmail`, `submit`, `toggleRememberMe`) e de asserção
(`assertRedirectedToFeed`, `assertEmailFieldHasError`). O spec só chama esses
métodos — nunca repete um `cy.get(seletor)` que já existe em outro `it`.

Fluxos completos reutilizados **entre specs diferentes** (ex.: "estar
logado" como pré-condição de um teste de feed) viram custom command em
`support/commands/`, não um método de Page Object.

**Regra de higiene:** todo comando/objeto criado precisa ser usado em pelo
menos um teste. Não deixar "código morto" acumulando (foi o caso do antigo
`cy.login()` em `commands.js`, que nunca era chamado pelo próprio spec de
login — removido).

## Nomenclatura

- **Arquivos de spec:** kebab-case, espelhando a página/rota do front.
- **`describe`:** nome da feature/tela (`'Login'`).
- **`it`:** `"<CT-XXX>-<slug-descritivo>: <descrição em português>"`, onde
  `CT-XXX` é o ID do cenário em [`massa-de-teste.md`](massa-de-teste.md).
  Exemplo: `'CT-002-login-sucesso-lembrar-me: login com sucesso marcando
  lembrar-me'`. O ID sozinho não diz nada em um relatório de execução; o
  slug resolve isso sem precisar abrir a massa de dados.
