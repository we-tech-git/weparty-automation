import { feedPage } from '../../support/pages/FeedPage'
import { loginPage } from '../../support/pages/LoginPage'
import { reportDialogPage } from '../../support/pages/ReportDialogPage'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// Botão de denunciar evento e comentário no web-app, contra o ambiente local. O teste só abre
// e fecha o diálogo (nada é enviado). Cobre o cenário WEPARTY-169.
const suite = Cypress.env('local') ? describe : describe.skip

suite('Botão de denunciar (ambiente local)', () => {
  let email
  let eventId
  const comentario = `comentario para denunciar ${Date.now()}`

  before(() => {
    // Quem denuncia (usuário 2) e quem comentou (usuário 5) são pessoas diferentes:
    // o botão "Reportar" só aparece no comentário de outra pessoa.
    cy.localUserEmail('user', 2).then((e) => { email = e })
    cy.localEventId(3).then((id) => { eventId = id })
    cy.apiLogin('user', 5).then(({ token }) => {
      cy.apiRequest('POST', `/events/${eventId}/comments`, { token, body: { content: comentario } })
        .its('status').should('be.oneOf', [200, 201])
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
    loginPage.visit()
    loginPage.fillCredentials({ email, password: LOCAL_TEST_PASSWORD })
    loginPage.submit()
    loginPage.assertRedirectedToFeed()
  })

  it('CT-230-denuncia-evento-no-feed: o botão de denunciar no card do feed abre a mini aba de denúncia', () => {
    // Arrange
    feedPage.assertLoaded()

    // Act
    reportDialogPage.openFromFeedCard()

    // Assert
    reportDialogPage.assertOpen('Reportar evento')
  })

  it('CT-231-denuncia-cancelar: cancelar fecha a mini aba sem enviar nada', () => {
    // Arrange
    feedPage.assertLoaded()
    reportDialogPage.openFromFeedCard()
    reportDialogPage.assertOpen('Reportar evento')

    // Act
    reportDialogPage.cancel()

    // Assert
    reportDialogPage.assertClosed()
  })

  it('CT-232-denuncia-evento-nos-detalhes: o botão de denunciar na tela do evento abre a mini aba', () => {
    // Arrange
    cy.visit(`/event/${eventId}`)

    // Act
    reportDialogPage.openFromEventDetails()

    // Assert
    reportDialogPage.assertOpen('Reportar evento')
  })

  it('CT-233-denuncia-comentario: o botão Reportar num comentário de outra pessoa abre a mini aba', () => {
    // Arrange
    cy.visit(`/event/${eventId}`)

    // Act
    reportDialogPage.openFromComment(comentario)

    // Assert
    cy.getBySel('report-dialog-textarea').should('be.visible')
  })
})
