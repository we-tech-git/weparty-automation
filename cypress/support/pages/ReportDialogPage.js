// Page Object do botão de denúncia (web-app) e do diálogo "Reportar" (ReportDialog.vue),
// usado para evento (card do feed e tela de detalhes) e para comentário. Só abre/fecha o
// diálogo — enviar a denúncia altera estado e é coberto por teste de API.
// Ver docs/arquitetura-e-organizacao.md.
class ReportDialogPage {
  // Card do feed: menu "Mais opções" -> "Reportar".
  openFromFeedCard (index = 0) {
    cy.getBySel('feed-card').eq(index).find('[data-testid="feed-card-more-options"]').click()
    cy.getBySel('feed-card-report').click()
  }

  // Tela de detalhes do evento (`/event/:id`).
  openFromEventDetails () {
    cy.getBySel('event-details-report').click()
  }

  // Aba de comentários da tela de detalhes -> "Reportar" no comentário de outra pessoa.
  openFromComment (commentText) {
    cy.contains('button', 'Comentários').click()
    cy.contains(commentText).should('be.visible')
      .closest('li, article, div')
      .parent()
      .contains('button', 'Reportar')
      .click()
  }

  assertOpen (title) {
    cy.contains(title).should('be.visible')
    cy.getBySel('report-dialog-textarea').should('be.visible')
    cy.getBySel('report-dialog-cancel').should('be.visible')
    cy.getBySel('report-dialog-submit').should('be.visible')
  }

  cancel () {
    cy.getBySel('report-dialog-cancel').click()
  }

  assertClosed () {
    cy.getBySel('report-dialog-textarea').should('not.exist')
  }
}

export const reportDialogPage = new ReportDialogPage()
