import { loginPage } from '../../support/pages/LoginPage'

// Mocka a resposta de sucesso do login, injetando o e-mail realmente
// digitado no cenário (a fixture guarda apenas o formato/shape da resposta).
// Ver docs/dados-e-integracao.md — toda chamada de API que altera estado é
// mockada, já que a suíte roda contra produção.
function mockLoginSuccess (email) {
  cy.fixture('api/login-success').then(mockResponse => {
    cy.intercept('POST', /\/users\/login(\?.*)?$/, {
      statusCode: 200,
      body: {
        ...mockResponse,
        data: {
          ...mockResponse.data,
          user: { ...mockResponse.data.user, email },
        },
      },
    }).as('loginRequest')
  })
}

describe('Login', () => {
  let credentials

  before(() => {
    cy.fixture('users/credentials').then(fixture => {
      credentials = fixture
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  it('CT-001-login-sucesso-lembrar-me: login com sucesso marcando lembrar-me', () => {
    // Arrange
    mockLoginSuccess(credentials.email)
    loginPage.visit()

    // Act
    loginPage.fillCredentials(credentials)
    loginPage.toggleRememberMe()
    loginPage.submit()

    // Assert
    cy.wait('@loginRequest')
    loginPage.assertRedirectedToFeed()
  })

  it('CT-002-login-sucesso-sem-lembrar-me: login com sucesso sem marcar lembrar-me', () => {
    // Arrange
    mockLoginSuccess(credentials.email)
    loginPage.visit()

    // Act
    loginPage.fillCredentials(credentials)
    loginPage.submit()

    // Assert
    cy.wait('@loginRequest')
    loginPage.assertRedirectedToFeed()
  })

  it('CT-003-login-falha-campos-vazios: login falha sem preencher nenhum campo', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.submit()

    // Assert
    loginPage.assertEmailFieldHasError()
    loginPage.assertPasswordFieldHasError()
    loginPage.assertStayedOnLogin()
  })

  it('CT-004-login-falha-apenas-email: login falha preenchendo apenas o email', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.fillEmail(credentials.email)
    loginPage.submit()

    // Assert
    loginPage.assertPasswordFieldHasError()
    loginPage.assertStayedOnLogin()
  })

  it('CT-005-login-falha-apenas-senha-lembrar-me: login falha preenchendo apenas a senha com lembrar-me', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.fillPassword(credentials.password)
    loginPage.toggleRememberMe()
    loginPage.submit()

    // Assert
    loginPage.assertEmailFieldHasError()
    loginPage.assertStayedOnLogin()
  })

  it('CT-006-login-sucesso-lembrar-me-mostrar-senha: login com sucesso + lembrar-me + mostrar senha', () => {
    // Arrange
    mockLoginSuccess(credentials.email)
    loginPage.visit()

    // Act
    loginPage.fillCredentials(credentials)
    loginPage.togglePasswordVisibility()
    loginPage.toggleRememberMe()
    loginPage.submit()

    // Assert
    loginPage.assertPasswordVisible()
    cy.wait('@loginRequest')
    loginPage.assertRedirectedToFeed()
  })

  it('CT-007-login-sucesso-mostrar-senha: login com sucesso + mostrar senha (sem lembrar-me)', () => {
    // Arrange
    mockLoginSuccess(credentials.email)
    loginPage.visit()

    // Act
    loginPage.fillCredentials(credentials)
    loginPage.togglePasswordVisibility()
    loginPage.submit()

    // Assert
    loginPage.assertPasswordVisible()
    cy.wait('@loginRequest')
    loginPage.assertRedirectedToFeed()
  })

  it('CT-008-login-falha-campos-vazios-mostrar-senha: login falha sem campos + mostrar senha', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.togglePasswordVisibility()
    loginPage.submit()

    // Assert
    loginPage.assertPasswordVisible()
    loginPage.assertEmailFieldHasError()
    loginPage.assertPasswordFieldHasError()
    loginPage.assertStayedOnLogin()
  })

  it('CT-009-login-falha-apenas-email-mostrar-senha: login falha preenchendo apenas email + mostrar senha', () => {
    // Arrange
    loginPage.visit()

    // Act
    loginPage.fillEmail(credentials.email)
    loginPage.togglePasswordVisibility()
    loginPage.submit()

    // Assert
    loginPage.assertPasswordVisible()
    loginPage.assertPasswordFieldHasError()
    loginPage.assertStayedOnLogin()
  })
})
