import { feedPage } from '../../support/pages/FeedPage'
import { loginPage } from '../../support/pages/LoginPage'
import { MOBILE_VIEWPORT, profileMobilePage } from '../../support/pages/ProfileMobilePage'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// Correções da versão mobile do web-app (WEPARTY-125 a 131), contra o ambiente local, em viewport de
// celular. O usuário confirma presença num evento pela API antes dos testes do card de confirmados.
const suite = Cypress.env('local') ? describe : describe.skip

suite('Versão mobile: perfil, header e rodapé (ambiente local)', () => {
  let email

  before(() => {
    cy.localUserEmail('user', 3).then((e) => { email = e })
    cy.localEventId(4).then((eventId) => {
      cy.apiLogin('user', 3).then(({ token }) => {
        cy.apiRequest('PUT', `/events/${eventId}/attendance`, { token, body: { status: 'GOING' } })
          .its('status').should('be.oneOf', [200, 201])
      })
    })
  })

  beforeEach(() => {
    cy.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height)
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
    loginPage.visit()
    loginPage.fillCredentials({ email, password: LOCAL_TEST_PASSWORD })
    loginPage.submit()
    loginPage.assertRedirectedToFeed()
    profileMobilePage.visit()
  })

  it('CT-250-mobile-header-uma-linha: logo, busca e avatar ficam na mesma linha', () => {
    // Arrange / Act: perfil aberto em viewport de celular

    // Assert
    profileMobilePage.assertHeaderInSingleRow()
  })

  it('CT-251-mobile-seguidores-botao: seguidores e seguindo têm aparência de botão', () => {
    // Assert
    profileMobilePage.assertFollowStatsLookClickable()
  })

  it('CT-252-mobile-abas-legiveis: as abas do perfil usam fonte de pelo menos 14px', () => {
    // Assert
    profileMobilePage.assertTabsReadable()
  })

  it('CT-253-mobile-confirmados-somente-leitura: card de confirmado sem botão cancelar e dentro da tela', () => {
    // Act
    profileMobilePage.openConfirmedTab()

    // Assert
    profileMobilePage.assertConfirmedCardsReadOnly()
  })

  it('CT-254-mobile-rodape-livre-do-menu: o fim do rodapé do perfil fica acima do menu fixo', () => {
    // Act
    profileMobilePage.scrollToBottom()

    // Assert
    profileMobilePage.assertFooterClearOfBottomNav()
  })

  it('CT-255-desktop-feed-wheel-na-lateral: no fim da coluna de tendências o feed central não rola junto', () => {
    // Arrange
    cy.viewport(1860, 958)
    cy.visit('/feed')
    feedPage.assertLoaded()

    // Act / Assert: wheel no fim da coluna que rola não vaza pro feed
    feedPage.assertTrendsWheelAtEndDoesNotScrollFeed()
  })

  it('CT-256-desktop-feed-wheel-sem-rolagem: coluna lateral sem o que rolar repassa o wheel pro feed', () => {
    // Arrange
    cy.viewport(1860, 958)
    cy.visit('/feed')
    feedPage.assertLoaded()

    // Act / Assert
    feedPage.assertSidebarWheelScrollsFeed()
  })
})
