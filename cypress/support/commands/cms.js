// Comandos do CMS (Next.js). Sem backend: toda chamada de API é mockada com `cy.intercept`
// (regra 5 do AGENTS.md), então estes specs rodam em qualquer ambiente que tenha `ENV_CMS_URL`.

/** Mocks padrão das telas do produtor (dashboard, meus eventos, detalhes do usuário). */
Cypress.Commands.add('cmsMockApi', () => {
  cy.fixture('cms/dashboard').then((body) => {
    cy.intercept('GET', /\/events\/my-dashboard(\?.*)?$/, { statusCode: 200, body }).as('cmsDashboard')
  })
  cy.fixture('cms/my-events').then((fixture) => {
    // As datas do fixture são relativas a hoje: com data absoluta, "agendado" (startDate futuro) envelhece e os
    // contadores das abas mudam sozinhos. Offsets em dias: evt-1/2/4 no futuro, evt-3/5 no passado.
    const DAY = 24 * 60 * 60 * 1000
    const offsets = { 'evt-1': 2, 'evt-2': 4, 'evt-3': -5, 'evt-4': 30, 'evt-5': -3 }
    const body = {
      ...fixture,
      events: fixture.events.map((event) => (event.id in offsets
        ? { ...event, startDate: new Date(Date.now() + offsets[event.id] * DAY).toISOString() }
        : event)),
    }
    cy.intercept('GET', /\/events\/my-events(\?.*)?$/, { statusCode: 200, body }).as('cmsMyEvents')
  })
  cy.intercept('GET', /\/interest(\?.*)?$/, { statusCode: 200, body: { data: [] } }).as('cmsInterests')
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
    // O cookie precisa existir ANTES do request da rota protegida: o proxy.ts do CMS decide o redirect no servidor.
    // Ele é gravado host-only (sem Domain), como o writeAuthCookie do app: cookie de domínio não é apagado pelo logout.
    const url = Cypress.env('cmsUrl')
    cy.visit(`${url}/login`, {
      onBeforeLoad (win) {
        win.localStorage.setItem('ACCESS_TOKEN', token)
        win.localStorage.setItem('LOGGED_USER', JSON.stringify(safeUser))
        win.localStorage.setItem('we-party-auth', JSON.stringify({ state: { token, user: safeUser }, version: 0 }))
      },
    })
    cy.window().then((win) => {
      win.document.cookie = `access_token=${token}; path=/; SameSite=Lax`
    })
    cy.visit(`${url}${path}`)
  })
})
