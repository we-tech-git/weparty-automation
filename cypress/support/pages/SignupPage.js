import { ROUTES } from '../constants/routes'
import { SIGNUP_REDIRECT_TIMEOUT } from '../constants/timeouts'

class SignupPage {
  visit () {
    cy.visit(ROUTES.SIGNUP)
    cy.get('#fullName', { timeout: SIGNUP_REDIRECT_TIMEOUT }).should('be.visible')
  }

  assertLoaded () {
    cy.url().should('include', ROUTES.SIGNUP)
  }

  assertFormVisible () {
    cy.get('#fullName').should('be.visible')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.get('#confirmPassword').should('be.visible')
    cy.get('.terms-checkbox').should('exist')
    cy.get('button[type="submit"]').should('be.visible')
  }

  fillForm ({ name, email, password }) {
    cy.get('#fullName').type(name)
    cy.get('#email').type(email)
    cy.get('#password').type(password)
    cy.get('#confirmPassword').type(password)
    cy.get('.terms-checkbox').check({ force: true })
  }

  submit () {
    cy.get('button[type="submit"]').click()
  }

  assertOn (route) {
    cy.url({ timeout: SIGNUP_REDIRECT_TIMEOUT }).should('include', route)
  }

  assertPinInputsVisible () {
    cy.get('.pin-input').should('have.length.at.least', 6)
      .first().should('be.visible')
  }

  fillVerificationPin (pin) {
    cy.get('.pin-input').each(($input, index) => {
      if (index < pin.length) {
        cy.wrap($input).type(pin[index])
      }
    })
  }

  skipCurrentStep () {
    cy.contains('Pular esta etapa por enquanto').click()
  }

  continueToFeed () {
    cy.get('button.continue-btn').click()
  }
}

export const signupPage = new SignupPage()
