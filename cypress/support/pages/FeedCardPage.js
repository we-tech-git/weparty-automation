// Page Object do card de evento do feed (`FeedCard.vue`). Concentra os
// seletores e ações do card — nenhum cy.get/cy.getBySel do card deve
// existir fora daqui. Sempre opera sobre o card indicado por `index`
// (padrão: o primeiro) — o feed real lista vários cards, e a fixture usada
// pelos testes (`api/events-recommendations.json`) propositalmente traz o
// evento controlado na posição 0 (os demais só existem para o feed não cair
// abaixo do MIN_EVENTS que dispara o fallback público em Feed.vue).
// Ver docs/arquitetura-e-organizacao.md e docs/dados-e-integracao.md.
class FeedCardPage {
  card (index = 0) {
    return cy.getBySel('feed-card').eq(index)
  }

  likeButton (index = 0) {
    return this.card(index).find('[data-testid="feed-card-like"]')
  }

  commentsToggleButton (index = 0) {
    return this.card(index).find('[data-testid="feed-card-comments-toggle"]')
  }

  shareButton (index = 0) {
    return this.card(index).find('[data-testid="feed-card-share"]')
  }

  toggleLike (index = 0) {
    this.likeButton(index).click()
  }

  toggleComments (index = 0) {
    this.commentsToggleButton(index).click()
  }

  share (index = 0) {
    this.shareButton(index).click()
  }

  assertLiked (index = 0) {
    this.likeButton(index)
      .should('have.attr', 'aria-pressed', 'true')
      .and('have.class', 'liked')
  }

  assertNotLiked (index = 0) {
    this.likeButton(index)
      .should('have.attr', 'aria-pressed', 'false')
      .and('not.have.class', 'liked')
  }

  assertLikesCount (count, index = 0) {
    this.likeButton(index).should('contain.text', String(count))
  }

  // "Comentários"/"Seja o primeiro a comentar!" são o título e o estado
  // vazio do painel inline (InlineComments.vue), que ainda não tem
  // data-testid próprio — cai no 3º nível da prioridade de seletores (texto
  // visível). O painel some via CSS (grid 0fr, ver InlinePanel.vue), então
  // `.should('be.visible')`/`'not.be.visible'` reflete o estado real.
  // `cy.contains` devolve o primeiro match no DOM — o card 0 é sempre o
  // primeiro renderizado, então o texto encontrado é sempre o dele.
  assertCommentsVisible () {
    cy.contains('Comentários').should('be.visible')
    cy.contains('Seja o primeiro a comentar!').should('be.visible')
  }

  assertCommentsHidden () {
    cy.contains('Seja o primeiro a comentar!').should('not.be.visible')
  }

  // ShareSheet.vue (mockada via useShareStore) não tem data-testid — mesmo
  // caso do painel de comentários, cai no texto visível do diálogo. O
  // título do evento já é suficiente para garantir que é o card certo.
  assertShareSheetVisible (eventTitle) {
    cy.contains('Compartilhar Evento').should('be.visible')
    cy.contains(eventTitle).should('be.visible')
  }
}

export const feedCardPage = new FeedCardPage()
