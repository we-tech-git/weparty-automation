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

  // Desktop (WEPARTY-231): a coluna de tendências rola sozinha; ao chegar no fim, o wheel
  // não pode puxar o feed central junto. O conteúdo extra garante que a coluna tem o que rolar.
  assertTrendsWheelAtEndDoesNotScrollFeed () {
    cy.getBySel('feed-trends').then(($trends) => {
      $trends.append('<div data-testid="trends-spacer" style="height: 2000px"></div>')
      $trends[0].scrollTop = $trends[0].scrollHeight
    })
    cy.getBySel('feed-main').then(($main) => {
      const before = $main[0].scrollTop
      cy.getBySel('feed-trends').trigger('wheel', { deltaY: 300 })
      cy.getBySel('feed-main').should(($after) => {
        expect($after[0].scrollTop, 'scroll do feed central').to.equal(before)
      })
    })
  }

  // Coluna sem o que rolar: o wheel continua indo para o feed, senão a página parece travada.
  assertSidebarWheelScrollsFeed () {
    cy.getBySel('feed-sidebar-nav').trigger('wheel', { deltaY: 300 })
    cy.getBySel('feed-main').should(($main) => {
      expect($main[0].scrollTop, 'scroll do feed central').to.be.greaterThan(0)
    })
  }

  assertCardsCount (count) {
    cy.getBySel('feed-card').should('have.length', count)
  }
}

export const feedPage = new FeedPage()
