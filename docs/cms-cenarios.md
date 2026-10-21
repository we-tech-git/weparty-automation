# Cenários do CMS (WEPARTY-232 — novo layout)

Specs em `cypress/e2e/cms/`. Todos **mockam a API** (`cy.intercept`, regra 5 do `AGENTS.md`) e só rodam quando há `ENV_CMS_URL` — não precisam de backend. Os specs antigos (`cms-smoke`, `cms-denuncias`, `cms-social-posts`) continuam exigindo o ambiente local completo (`Cypress.env('local')`).

## Como rodar (sem backend)
```
cd ../frontend/we-party-cms && yarn build && yarn next start -p 3055
cd ../../weparty-automation
ENV_CMS_URL=http://127.0.0.1:3055 npx cypress run --spec "cypress/e2e/cms/cms-*-layout.cy.js,cypress/e2e/cms/cms-seguranca.cy.js,cypress/e2e/cms/cms-admin-shell.cy.js"
```
Use `next start` (build de produção): o `next dev` fica lento para a primeira visita e o Cypress estoura o timeout. Para testar o login com Google configurado, defina `CYPRESS_cmsGoogleConfigured=1` (pula o CT-169).

Retroativo no ambiente local completo (backend + banco): `node env.mjs run --backend D --cms D --webapp D -- node run-cypress.mjs` — roda `cms-smoke` (CT-150 a 152, login por `input[type=email]`, `input[type=password]`, `button[type=submit]`, contador `0/600`).

## Cenários
| CT | Spec | O que garante |
|---|---|---|
| 160–169 | `cms-login-layout` | painel da marca (desktop) / faixa (mobile), olho da senha, validações, sucesso, 401, botão carregando, lembrar-me, Google indisponível |
| 170–174 | `cms-home-layout` | indicadores, painéis, menu ativo, barra inferior no mobile, métrica ausente = "—", CTA criar evento, admin só para admin |
| 175–180 | `cms-my-events-layout` | lista e contagem das abas, filtro e busca, seleção em lote, excluir com confirmação / erro, mobile |
| 181–186 | `cms-new-event-layout` | painéis, prévia ao vivo, obrigatórios, publicar sem duplo envio, FAQ, mobile |
| 187–189 | `cms-admin-shell` | retroativo: telas de administração dentro da casca nova; menu completo para admin; bloqueio para não-admin |
| 190–200 | `cms-seguranca` | sem vazamento no storage, token/senha fora da URL, guard sem sessão, login logado redireciona, cabeçalhos, logout limpa sessão, 401 derruba sessão, XSS, upload SVG/grande, links `_blank` |

Seletores: `data-testid` (ex.: `login-email`, `toggle-password`, `brand-panel`, `cms-sidebar`, `event-card`, `bulk-bar`, `event-submit`, `cover-dropzone`). Ao criar componente novo no CMS, adicionar o `data-testid` junto.
