import { ROUTES } from '../constants/routes'
import { EVENT_DETAILS_VISIBLE_TIMEOUT } from '../constants/timeouts'

class EventDetailsPage {
  visit (eventId) {
    cy.visit(`${ROUTES.EVENT}/${eventId}`)
  }

  assertLoaded (eventTitle) {
    cy.contains('h1', eventTitle, { timeout: EVENT_DETAILS_VISIBLE_TIMEOUT }).should('be.visible')
  }

  // O botao fica na coluna de acoes, abaixo da dobra. `should('be.visible')`
  // sozinho nao rola a pagina, e o Cypress considera o elemento coberto pelo
  // ancestro fixo (header) como invisivel — por isso o scrollIntoView antes.
  assertEuVouVisible () {
    cy.contains('button', /eu vou!?/i).scrollIntoView().should('be.visible')
  }

  clickEuVou () {
    cy.contains('button', /eu vou!?/i).scrollIntoView().click()
  }

  assertConfirmed () {
    cy.contains('button', /confirmado!?/i).scrollIntoView().should('be.visible')
  }

  clickFavorite () {
    cy.contains('button', /Favoritar/i).scrollIntoView().click()
  }

  assertFavorited () {
    cy.contains('button', /Favoritado/i).scrollIntoView().should('be.visible')
  }

  clickShare () {
    cy.contains('button', /Enviar/i).scrollIntoView().click()
  }

  assertShareSheetVisible (eventTitle) {
    cy.contains('Compartilhar Evento').should('be.visible')
      .parent('header')
      .next()
      .should('be.visible')
      .and('contain.text', eventTitle)
  }
}

export const eventDetailsPage = new EventDetailsPage()
