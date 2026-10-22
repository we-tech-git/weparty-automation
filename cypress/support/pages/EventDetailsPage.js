import { ROUTES } from '../constants/routes'
import { EVENT_DETAILS_VISIBLE_TIMEOUT } from '../constants/timeouts'

class EventDetailsPage {
  visit (eventId) {
    cy.visit(`${ROUTES.EVENT}/${eventId}`)
  }

  assertLoaded (eventTitle) {
    cy.contains('h1', eventTitle, { timeout: EVENT_DETAILS_VISIBLE_TIMEOUT }).should('be.visible')
  }

  assertOrganizer (organizerName) {
    cy.contains('b', organizerName).should('be.visible')
  }

  assertEventDate (datePart) {
    cy.contains('b', datePart).should('be.visible')
  }

  assertDescriptionSnippet (snippet) {
    cy.contains('p', snippet).should('exist')
  }

  assertAttendeesLabel () {
    cy.contains('pessoas vão').should('be.visible')
  }

  assertConfirmedLabel () {
    cy.contains('confirmados').should('be.visible')
  }

  openTab (label) {
    cy.contains('button', new RegExp(label, 'i')).scrollIntoView().click()
  }

  openInfoTab () {
    this.openTab('Informações')
  }

  openLineupTab () {
    this.openTab('Atrações')
  }

  openLocationTab () {
    this.openTab('Local')
  }

  openCommentsTab () {
    this.openTab('Comentários')
  }

  assertInfoPanelVisible () {
    cy.contains('h3', 'Sobre o evento').scrollIntoView().should('be.visible')
  }

  assertLineupPanelVisible () {
    cy.contains('h3', /Atrações/).scrollIntoView().should('be.visible')
  }

  assertLineupItem (artistName) {
    cy.contains('b', artistName).should('be.visible')
  }

  assertLocationPanelVisible () {
    cy.contains('h3', 'Onde acontece').scrollIntoView().should('be.visible')
  }

  assertMapVisible () {
    cy.get('iframe[title="Mapa do local do evento"]').should('be.visible')
  }

  clickHowToGetThere () {
    cy.contains('button', 'Como chegar').scrollIntoView().click()
  }

  assertCommentsPanelVisible () {
    cy.contains('h4', 'Comentários').scrollIntoView().should('be.visible')
    cy.contains('Seja o primeiro a comentar!').should('be.visible')
  }

  // O botao de curtir do hero nao tem data-testid nem id semantico. A classe
  // `btn-like-hero` é o único gancho estável exposto pelo componente.
  likeButton () {
    return cy.get('button.btn-like-hero')
  }

  clickLike () {
    this.likeButton().scrollIntoView().click()
  }

  assertLikeCount (count) {
    this.likeButton().should('contain.text', String(count))
  }

  followButton () {
    return cy.contains('button', /^(Seguir|Seguindo)/)
  }

  clickFollow () {
    this.followButton().scrollIntoView().click()
  }

  assertNotFollowing () {
    cy.contains('button', 'Seguir').scrollIntoView()
      .should('be.visible')
      .and('not.contain.text', 'Seguindo')
  }

  assertFollowing () {
    cy.contains('button', /Seguindo/).scrollIntoView().should('be.visible')
  }

  assertReadMoreVisible () {
    cy.contains('button', 'Ler mais').scrollIntoView().should('be.visible')
  }

  clickReadMore () {
    cy.contains('button', 'Ler mais').scrollIntoView().click()
  }

  assertReadLessVisible () {
    cy.contains('button', 'Ler menos').scrollIntoView().should('be.visible')
  }

  clickReadLess () {
    cy.contains('button', 'Ler menos').scrollIntoView().click()
  }

  assertFaqSectionVisible () {
    cy.contains('button', /Perguntas Frequentes/).scrollIntoView().should('be.visible')
  }

  openFaqList () {
    cy.contains('button', /Perguntas Frequentes/).scrollIntoView().click()
  }

  toggleFaq (question) {
    cy.contains('button', question).scrollIntoView().click()
  }

  assertFaqAnswerVisible (answer) {
    cy.contains('p', answer).should('be.visible')
  }

  // Ao recolher, o painel do FAQ usa v-if: a resposta sai do DOM (nao basta
  // checar visibilidade, o elemento deixa de existir).
  assertFaqAnswerHidden (answer) {
    cy.contains('p', answer).should('not.exist')
  }

  mobileBar () {
    return cy.contains('b', 'Eu vou?').parent().parent()
  }

  assertMobileBarVisible () {
    this.mobileBar().should('be.visible')
  }

  clickMobileRsvp () {
    this.mobileBar().find('button').contains(/eu vou/i).click()
  }

  assertMobileConfirmed () {
    this.mobileBar().find('button').should('contain.text', 'Confirmado')
  }

  assertErrorState () {
    cy.contains('Não foi possível carregar os detalhes do evento.').should('be.visible')
    cy.contains('button', 'Tentar novamente').should('be.visible')
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
