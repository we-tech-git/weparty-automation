# Ambiente local de validação

A suíte roda em dois modos. O padrão continua sendo **produção** (`wepartyapp.com`, escritas mockadas, regra 5 do `AGENTS.md`). O modo **local** usa o ambiente do desktop de desenvolvimento: backend, CMS e web-app reais, Postgres com o **dump anonimizado** da produção e uma caixa de e-mail de teste (Mailpit). Nele nada é mockado e escrever é liberado.

## Como o modo local liga
`cypress.config.js` lê variáveis definidas por `agent/env.mjs`:

| Variável | Uso |
|---|---|
| `ENV_WEBAPP_URL` | `baseUrl` (ex.: `http://127.0.0.1:15173`). Sua presença liga `Cypress.env('local')` |
| `ENV_API_URL` | `Cypress.env('apiUrl')` (`http://localhost:8000`; o CSP do web-app só libera esse endereço) |
| `ENV_CMS_URL` | `Cypress.env('cmsUrl')` |
| `ENV_MAIL_URL` | `Cypress.env('mailUrl')` (API do Mailpit) |
| `ENV_NAME` | nome do projeto Docker (descobre o container do banco) |

Rodar tudo (sobe o ambiente, testa e derruba): `node env.mjs run --backend D --cms D --webapp D -- node run-cypress.mjs`.

## O que existe só no modo local
- Specs novos usam `Cypress.env('local') ? describe : describe.skip` — em produção são pulados.
- Comandos em `support/commands/local.js`: `dbQuery`, `localUserEmail(role)`, `apiRequest`, `apiLogin(role)`, `localEventId`.
- A task `dbQuery` consulta o Postgres local via `docker exec`; só funciona com `ENV_WEBAPP_URL`.
- Senha de **todos** os usuários do dump: `Teste@123` (constante em `support/constants/local.js`; não é segredo).
- `cy.getVerificationPin` lê o PIN no Mailpit em vez do sharklasers.
- Cada visita a `/confirm-email` reenvia o código: ler o PIN **depois** de abrir a página (`minMessages`).

## Dump anonimizado
Gerado de produção por pg_dump somente leitura, restaurado num Postgres descartável e anonimizado (`sanitize.sql`): e-mails, nomes, usernames, senhas, chaves, tokens, fotos e motivos de denúncia. Papéis, ids, relações e o conteúdo público dos eventos ficam. Nunca versionar o dump.

## Testes novos (CT-100 a CT-151)
API (`e2e/api/`): saúde e contrato, login, guards (401/403), papéis, eventos, curtir, comentar (criar/editar/apagar, validação), favoritar. E2E: `private/feed-real` (login real e curtida persistida), `cms/cms-smoke` (login de admin e garantia de que o CMS só fala com a API local). `signup.cy.js` foi atualizado para as rotas atuais (`/signup`, `/confirm-email`, `/interest`, `/add-friends`, `/congratulations`, `/feed`).

## Bug conhecido
CT-135 (`it.skip`): comentário só com espaços é aceito (201). Trocar por `it` quando corrigido.

## Smoke pós-deploy em produção

`cypress/e2e/postdeploy/smoke-producao.cy.js` é um smoke **somente leitura** que o agente dev roda depois do merge e do deploy. Só executa com `CYPRESS_postdeploy=1`. Credenciais e URLs nunca ficam no repositório: `CYPRESS_prodEmail`, `CYPRESS_prodPassword`, `CYPRESS_prodCmsUrl` e `CYPRESS_apiUrl`, mais `CYPRESS_BASE_URL` para o web-app.

```
CYPRESS_postdeploy=1 CYPRESS_BASE_URL=https://wepartyapp.com CYPRESS_apiUrl=https://api.wepartyapp.com \
CYPRESS_prodCmsUrl=https://cms.wepartyapp.com CYPRESS_prodEmail=... CYPRESS_prodPassword=... \
npx cypress run --spec "cypress/e2e/postdeploy/**"
```
