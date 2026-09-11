import { ROUTES } from '../constants/routes'
import { LOGIN_FORM_VISIBLE_TIMEOUT, LOGIN_REDIRECT_TIMEOUT } from '../constants/timeouts'

// Page Object da tela de Login (`/public/Login`). Concentra os seletores e
// ações da tela — nenhum cy.get de Login deve existir fora daqui.
// Ver docs/arquitetura-e-organizacao.md.
class LoginPage {
  visit () {
    cy.visit(`${ROUTES.LOGIN}?force=true`)
    cy.getBySel('login-email', { timeout: LOGIN_FORM_VISIBLE_TIMEOUT }).should('be.visible')
  }

  fillEmail (email) {
    cy.getBySel('login-email').type(email)
  }

  fillPassword (password) {
    cy.getBySel('login-password').type(password)
  }

  fillCredentials ({ email, password }) {
    if (email) this.fillEmail(email)
    if (password) this.fillPassword(password)
  }

  toggleRememberMe () {
    cy.getBySel('login-remember-me').check()
  }

  togglePasswordVisibility () {
    cy.getBySel('login-password-toggle').click()
  }

  submit () {
    cy.getBySel('login-submit').click()
  }

  assertPasswordVisible () {
    cy.getBySel('login-password').should('have.attr', 'type', 'text')
  }

  assertRedirectedToFeed () {
    cy.url({ timeout: LOGIN_REDIRECT_TIMEOUT }).should('include', ROUTES.FEED)
  }

  assertStayedOnLogin () {
    cy.url().should('include', ROUTES.LOGIN)
  }

  assertEmailFieldHasError () {
    cy.getBySel('login-email-error').should('be.visible')
  }

  assertPasswordFieldHasError () {
    cy.getBySel('login-password-error').should('be.visible')
  }
}

export const loginPage = new LoginPage()
