import { ROUTES } from '../constants/routes'
import { FEED_CARD_VISIBLE_TIMEOUT } from '../constants/timeouts'

// Page Object da seção Top eventos do feed (`/feed?tab=top-events`).
// A lista usa o mesmo FeedCard do feed (ações e dados do card continuam em
// FeedCardPage.js); aqui ficam apenas o cabeçalho, o ranking, os estados da
// lista e a navegação próprios dessa seção.
// Ver docs/arquitetura-e-organizacao.md.
class TopEventsPage {
  visit () {
    cy.visit(`${ROUTES.FEED}?tab=top-events`)
  }

  openFromSidebar () {
    cy.getBySel('feed-sidebar-nav').contains('button', 'Top eventos').click()
  }

  assertLoaded () {
    cy.getBySel('feed-main', { timeout: FEED_CARD_VISIBLE_TIMEOUT }).should('be.visible')
    cy.getBySel('feed-card', { timeout: FEED_CARD_VISIBLE_TIMEOUT }).should('have.length.at.least', 1)
  }

  assertBreadcrumb (label) {
    cy.get('nav[aria-label="Navegação"]').should('contain.text', label)
  }

  assertBreadcrumbHidden () {
    cy.get('nav[aria-label="Navegação"]').should('not.exist')
  }

  assertUrlTopEvents () {
    cy.location('search').should('contain', 'tab=top-events')
  }

  assertUrlHome () {
    cy.location('search').should('not.contain', 'tab=')
  }

  card (index = 0) {
    return cy.getBySel('feed-card').eq(index)
  }

  cards () {
    return cy.getBySel('feed-card')
  }

  assertCardsCount (count) {
    this.cards().should('have.length', count)
  }

  assertRank (index, rank) {
    this.card(index).should('contain.text', `#${rank}`)
  }

  assertTabsHidden () {
    cy.get('nav[aria-label="Seções do feed"]').should('not.exist')
  }

  assertTabsVisible () {
    cy.get('nav[aria-label="Seções do feed"]').should('be.visible')
  }

  assertEmpty () {
    cy.contains('p', 'Nenhum evento encontrado para o momento.').should('be.visible')
  }

  assertNoCards () {
    this.cards().should('not.exist')
  }

  clickBack () {
    cy.get('button[aria-label="Voltar para o feed"]').click()
  }

  assertNoHorizontalOverflow () {
    cy.document().then((doc) => {
      const root = doc.documentElement
      expect(root.scrollWidth, 'sem overflow horizontal').to.be.at.most(root.clientWidth + 1)
    })
  }
}

export const topEventsPage = new TopEventsPage()
