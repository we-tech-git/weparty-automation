# WeParty Automation — MEMORY do Agente

## Visão Geral do Projeto

Testes automatizados E2E do app [WeParty](https://www.wepartyapp.com) com Cypress.

- **Base URL:** `https://www.wepartyapp.com`
- **Viewport padrão:** 1280×720 (desktop)
- **Framework:** Cypress 15.x
- **Linguagem:** JavaScript (CommonJS)
- **Node.js:** 18+

## Estrutura

```
Test_Scenarios/     ← Cenários em linguagem natural (fonte da verdade)
cypress/
├── e2e/            ← Testes convertidos (.cy.js)
├── fixtures/       ← Dados de teste (credentials.json não versionado)
└── support/
    ├── commands.js ← Comandos customizados
    └── e2e.js      ← Config global
.agent/             ← Instruções e memória do agente
docs/               ← Documentação do projeto
```

## Convenções de Código Cypress

### Seletores
- Sempre usar fallback múltiplo: `cy.get('input[type="email"], input[name="email"], input[id="email"]')`
- Preferir `data-cy` quando disponível, caso contrário usar cascata de seletores por atributo
- Textos de botão em português: `button:contains("Entrar")`, `button:contains("Login")`

### Comandos Customizados (commands.js)
- `cy.login(email, password)` — login completo (visita /public/Login, preenche campos, submete)

### Fixtures
- `credentials.json` — `{ email, password, signup: { name, password, email_domain } }`
- Signup usa email descartável (`sharklasers.com`) com sufixo único de timestamp

### Timeouts
- `defaultCommandTimeout: 10000`
- `pageLoadTimeout: 60000`
- Em asserts de URL pós-navegação, usar `{ timeout: 15000 }`

### Padrão de teste
- `describe('NomeDaFeature', () => { beforeEach(() => { cy.visit('...') }) ... })`
- `it('Deve ...', () => { ... })` — descrições em português
- URLs públicas: `/public/Login`, `/public/Signup`, `/public/ConfirmEmail`, etc.
- URLs privadas: `/private/feed`

## Fluxo de Pipeline

1. **Cenário** → escrito em `Test_Scenarios/*.md` no formato DADO/QUANDO/ENTÃO
2. **Adaptação** → mesma .md ganha seção "Cenário Adaptado" com detalhes técnicos
3. **Conversão** → `.agent/prompt-convert-scenarios-into-instruction.md` guia o agente a gerar `.cy.js`
4. **Arquivo gerado** → salvo em `cypress/e2e/` seguindo nome do cenário

## Nomenclatura

- Arquivos de cenário: `WEPARTY-{ID}.md`
- Arquivos de teste: `{feature}.cy.js` (ex: `login.cy.js`, `signup.cy.js`)