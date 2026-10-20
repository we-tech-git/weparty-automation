// Mocks de LEITURA disparados ao montar o feed autenticado (Feed.vue) e o
// card (FeedCard.vue -> InlineComments.vue). Nao alteram estado, mas precisam
// ser mockados: a suite roda contra producao com um token de login tambem
// mockado, entao qualquer uma dessas chamadas reais responderia 401 - e
// `callApi` (we-party-web-app src/api/index.ts) desloga o usuario e redireciona
// pra fora do feed a qualquer 401 com token presente. Ver
// docs/dados-e-integracao.md.
Cypress.Commands.add('mockFeedReads', () => {
  cy.fixture('api/events-recommendations').then(fixture => {
    cy.intercept('GET', /\/events\/recommendations(\?.*)?$/, fixture).as('getFeedEvents')
  })
  cy.fixture('api/event-comments-empty').then(fixture => {
    cy.intercept('GET', /\/events\/[^/]+\/comments(\?.*)?$/, fixture).as('getEventComments')
  })
  cy.fixture('api/user-interests-empty').then(fixture => {
    cy.intercept('GET', /\/users\/interests(\?.*)?$/, fixture).as('getUserInterests')
  })
  cy.fixture('api/events-likes-empty').then(fixture => {
    cy.intercept('GET', /\/events\/likes(\?.*)?$/, fixture).as('getLikedEvents')
  })
  cy.fixture('api/events-trending-empty').then(fixture => {
    cy.intercept('GET', /\/events\/top(\?.*)?$/, fixture).as('getTrendingEvents')
  })
})
