import { FEED_CARD_VISIBLE_TIMEOUT } from '../constants/timeouts'

// Page Object da tela de Feed (`/feed`). O acesso à tela acontece
// via `cy.login()` (que já redireciona para cá) — este objeto cobre apenas
// a espera pelo carregamento inicial dos cards. Ações/asserções de um card
// específico vivem em FeedCardPage.js.
// Ver docs/arquitetura-e-organizacao.md.
class FeedPage {
  assertLoaded () {
    cy.getBySel('feed-card', { timeout: FEED_CARD_VISIBLE_TIMEOUT }).should('have.length.at.least', 1)
  }

  assertCardsCount (count) {
    cy.getBySel('feed-card').should('have.length', count)
  }
}

export const feedPage = new FeedPage()
