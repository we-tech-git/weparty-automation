const EMAIL = 'leonidas@sharklasers.com'
const PASSWORD = 'Zqwh/il4tq'

function mockLoginSuccess () {
  cy.intercept('POST', /\/users\/login(\?.*)?$/, {
    statusCode: 200,
    body: {
      success: true,
      message: 'Login realizado',
      data: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
        user: {
          uid: '12345',
          username: 'leonidas',
          name: 'Leonidas',
          email: EMAIL,
          photoURL: '',
          birthday: null,
          gender: '',
        },
      },
    },
  }).as('loginRequest')
}

describe('Login', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  it('Teste 1: login com sucesso marcando lembrar-me', () => {
    mockLoginSuccess()
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)
    cy.get('#password').type(PASSWORD)

    cy.get('.remember-me input[type="checkbox"]').check()

    cy.get('button[type="submit"].btn-primary').click()

    cy.wait('@loginRequest', { timeout: 20000 })
    cy.url({ timeout: 20000 }).should('include', '/private/feed')
  })

  it('Teste 2: login com sucesso sem marcar lembrar-me', () => {
    mockLoginSuccess()
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)
    cy.get('#password').type(PASSWORD)

    cy.get('button[type="submit"].btn-primary').click()

    cy.wait('@loginRequest', { timeout: 20000 })
    cy.url({ timeout: 20000 }).should('include', '/private/feed')
  })

  it('Teste 3: login falha sem preencher nenhum campo', () => {
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')

    cy.get('button[type="submit"].btn-primary').click()

    cy.get('.error-message').should('be.visible')
    cy.get('#email.input-field.has-error').should('be.visible')
    cy.get('#password.input-field.has-error').should('be.visible')

    cy.url().should('include', '/public/Login')
  })

  it('Teste 4: login falha preenchendo apenas o email', () => {
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)

    cy.get('button[type="submit"].btn-primary').click()

    cy.get('.error-message').should('be.visible')
    cy.get('#password.input-field.has-error').should('be.visible')

    cy.url().should('include', '/public/Login')
  })

  it('Teste 5: login falha preenchendo apenas a senha com lembrar-me', () => {
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#password').type(PASSWORD)
    cy.get('.remember-me input[type="checkbox"]').check()

    cy.get('button[type="submit"].btn-primary').click()

    cy.get('.error-message').should('be.visible')
    cy.get('#email.input-field.has-error').should('be.visible')

    cy.url().should('include', '/public/Login')
  })

  it('Teste 6: login com sucesso + lembrar-me + mostrar senha', () => {
    mockLoginSuccess()
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)
    cy.get('#password').type(PASSWORD)

    cy.get('button.eye-button').click()
    cy.get('#password').should('have.attr', 'type', 'text')

    cy.get('.remember-me input[type="checkbox"]').check()

    cy.get('button[type="submit"].btn-primary').click()

    cy.wait('@loginRequest', { timeout: 20000 })
    cy.url({ timeout: 20000 }).should('include', '/private/feed')
  })

  it('Teste 7: login com sucesso + mostrar senha (sem lembrar-me)', () => {
    mockLoginSuccess()
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)
    cy.get('#password').type(PASSWORD)

    cy.get('button.eye-button').click()
    cy.get('#password').should('have.attr', 'type', 'text')

    cy.get('button[type="submit"].btn-primary').click()

    cy.wait('@loginRequest', { timeout: 20000 })
    cy.url({ timeout: 20000 }).should('include', '/private/feed')
  })

  it('Teste 8: login falha sem campos + mostrar senha', () => {
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')

    cy.get('button.eye-button').click()
    cy.get('#password').should('have.attr', 'type', 'text')

    cy.get('button[type="submit"].btn-primary').click()

    cy.get('.error-message').should('be.visible')
    cy.get('#email.input-field.has-error').should('be.visible')
    cy.get('#password.input-field.has-error').should('be.visible')

    cy.url().should('include', '/public/Login')
  })

  it('Teste 9: login falha preenchendo apenas email + mostrar senha', () => {
    cy.visit('/public/Login?force=true')

    cy.get('#email', { timeout: 15000 }).should('be.visible')
    cy.get('#email').type(EMAIL)

    cy.get('button.eye-button').click()
    cy.get('#password').should('have.attr', 'type', 'text')

    cy.get('button[type="submit"].btn-primary').click()

    cy.get('.error-message').should('be.visible')
    cy.get('#password.input-field.has-error').should('be.visible')

    cy.url().should('include', '/public/Login')
  })
})
