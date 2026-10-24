import { CMS_ROUTES } from '../constants/routes'

// Page Object do login do CMS (`/login`, WEPARTY-232 — novo layout).
class CmsLoginPage {
  visit () {
    cy.visit(`${Cypress.env('cmsUrl')}${CMS_ROUTES.LOGIN}`)
    cy.getBySel('login-form').should('be.visible')
  }

  fill ({ email, password }) {
    if (email) cy.getBySel('login-email').type(email)
    if (password) cy.getBySel('login-password').type(password, { log: false })
  }

  submit () {
    cy.getBySel('login-submit').click()
  }

  toggleRemember (checked = true) {
    // A caixa visual cobre o input nativo (sr-only): o clique vai no rótulo.
    cy.getBySel('login-remember').closest('label').click()
    cy.getBySel('login-remember').should(checked ? 'be.checked' : 'not.be.checked')
  }

  togglePasswordVisibility () {
    cy.getBySel('toggle-password').click()
  }

  clickGoogle () {
    cy.getBySel('login-google').hydrated().click()
  }

  assertBrandPanelVisible (visible = true) {
    cy.getBySel('brand-panel').should(visible ? 'be.visible' : 'not.be.visible')
  }

  assertPasswordType (type) {
    cy.getBySel('login-password').should('have.attr', 'type', type)
  }

  assertEmailError (text) {
    cy.getBySel('login-email-error').should('be.visible').and('contain.text', text)
  }

  assertPasswordError (text) {
    cy.getBySel('login-password-error').should('be.visible').and('contain.text', text)
  }

  assertToast (type) {
    cy.getBySel(`toast-${type}`).should('be.visible')
  }

  assertOnLogin () {
    cy.url().should('include', CMS_ROUTES.LOGIN)
  }

  assertOnHome () {
    cy.url({ timeout: 20000 }).should('include', CMS_ROUTES.HOME)
  }
}

export const cmsLoginPage = new CmsLoginPage()
