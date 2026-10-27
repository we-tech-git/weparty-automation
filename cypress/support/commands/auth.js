import { loginPage } from '../pages/LoginPage'

// "Estar logado" é uma pré-condição compartilhada por qualquer spec de tela
// privada (ex.: feed) — por isso vira custom command em vez de método do
// LoginPage. Reaproveita o mesmo mock de sucesso do login.cy.js e realiza o
// fluxo real pela UI, terminando com o usuário redirecionado ao feed.
// Ver docs/arquitetura-e-organizacao.md.
// `userOverrides` permite que um spec injete campos que o backend real devolve
// mas a fixture enxuta de login não traz (ex.: o `id` usado pelo perfil).
Cypress.Commands.add('login', (userOverrides = {}) => {
  cy.fixture('users/credentials').then(credentials => {
    cy.fixture('api/login-success').then(mockResponse => {
      cy.intercept('POST', /\/users\/login(\?.*)?$/, {
        statusCode: 200,
        body: {
          ...mockResponse,
          data: {
            ...mockResponse.data,
            ...userOverrides,
            user: { ...mockResponse.data.user, ...userOverrides, email: credentials.email },
          },
        },
      }).as('loginRequest')
    })

    loginPage.visit()
    loginPage.fillCredentials(credentials)
    loginPage.submit()

    cy.wait('@loginRequest')
    loginPage.assertRedirectedToFeed()
  })
})
