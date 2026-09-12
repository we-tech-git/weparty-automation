import { loginPage } from '../pages/LoginPage'

// "Estar logado" é uma pré-condição compartilhada por qualquer spec de tela
// privada (ex.: feed) — por isso vira custom command em vez de método do
// LoginPage. Reaproveita o mesmo mock de sucesso do login.cy.js e realiza o
// fluxo real pela UI, terminando com o usuário redirecionado ao feed.
// Ver docs/arquitetura-e-organizacao.md.
Cypress.Commands.add('login', () => {
  cy.fixture('users/credentials').then(credentials => {
    cy.fixture('api/login-success').then(mockResponse => {
      cy.intercept('POST', /\/users\/login(\?.*)?$/, {
        statusCode: 200,
        body: {
          ...mockResponse,
          data: {
            ...mockResponse.data,
            user: { ...mockResponse.data.user, email: credentials.email },
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
