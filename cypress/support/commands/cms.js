// Comandos do CMS (Next.js). Sem backend: toda chamada de API é mockada com `cy.intercept`
// (regra 5 do AGENTS.md), então estes specs rodam em qualquer ambiente que tenha `ENV_CMS_URL`.

/** Mocks padrão das telas do produtor (dashboard, meus eventos, detalhes do usuário). */
Cypress.Commands.add('cmsMockApi', () => {
  cy.fixture('cms/dashboard').then((body) => {
    cy.intercept('GET', /\/events\/my-dashboard(\?.*)?$/, { statusCode: 200, body }).as('cmsDashboard')
  })
  cy.fixture('cms/my-events').then((body) => {
    cy.intercept('GET', /\/events\/my-events(\?.*)?$/, { statusCode: 200, body }).as('cmsMyEvents')
  })
  cy.intercept('GET', /\/interests(\?.*)?$/, { statusCode: 200, body: [] }).as('cmsInterests')
})

/**
 * Entra no CMS já autenticado, sem passar pela tela de login: grava token/usuário no storage
 * (mesmas chaves do `auth.store.ts`) e o cookie lido pelo proxy, antes de a página carregar.
 */
Cypress.Commands.add('cmsVisitLogged', (path, { roles = ['admin'], viewport } = {}) => {
  if (viewport) cy.viewport(viewport[0], viewport[1])
  cy.fixture('cms/login-success').then(({ data }) => {
    const { token, apiKey, passwordResetToken, googleId, ...user } = data
    void apiKey; void passwordResetToken; void googleId
    const safeUser = { ...user, roles }
    // O cookie precisa existir ANTES do primeiro request: o proxy.ts do CMS decide o redirect no servidor.
    cy.setCookie('access_token', token, { domain: new URL(Cypress.env('cmsUrl')).hostname, path: '/' })
    cy.visit(`${Cypress.env('cmsUrl')}${path}`, {
      onBeforeLoad (win) {
        win.localStorage.setItem('ACCESS_TOKEN', token)
        win.localStorage.setItem('LOGGED_USER', JSON.stringify(safeUser))
        win.localStorage.setItem('we-party-auth', JSON.stringify({ state: { token, user: safeUser }, version: 0 }))
      },
    })
  })
})
