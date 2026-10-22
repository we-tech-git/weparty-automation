import { ROUTES } from '../../support/constants/routes'
import { guestPage } from '../../support/pages/GuestPage'
import { updatesPage } from '../../support/pages/UpdatesPage'

// Navegação do visitante e URLs do app (só leitura: roda em produção e no ambiente local).
// Cobre os cenários WEPARTY-178 (navegar sem logar), 179 (URL sem /public ou /private)
// e 180 (rota ou ação que exige login leva a /login).
describe('Navegação do visitante', () => {
  const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.EXPLORE, ROUTES.UPDATES, ROUTES.LOGIN, '/signup']

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  it('CT-210-visitante-navega-livre: sem login, as telas públicas abrem e a navegação entre elas não pede login', () => {
    // Act + Assert - cada tela pública abre na própria URL, sem redirecionar
    PUBLIC_ROUTES.forEach((route) => guestPage.visitPublic(route))

    // Act - navegação dentro do app (SPA): novidades -> explorar eventos
    updatesPage.visit()
    cy.contains('button', 'Explorar eventos').click()

    // Assert
    cy.location('pathname').should('eq', ROUTES.EXPLORE)
  })

  it('CT-211-url-sem-prefixo-legado: nenhuma URL nem link do app contém /public ou /private ao navegar', () => {
    // Act + Assert - URL e links de cada tela pública
    PUBLIC_ROUTES.forEach((route) => {
      guestPage.visitPublic(route)
      guestPage.assertCleanUrl()
      guestPage.assertLinksWithoutLegacyPrefix()
    })

    // Act - navegação por clique
    updatesPage.visit()
    cy.contains('button', 'Explorar eventos').click()

    // Assert
    guestPage.assertCleanUrl()
  })

  it('CT-212-rota-privada-vai-para-login: sem login, abrir uma rota que exige conta leva a /login', () => {
    // Act
    guestPage.visitPrivateRoute(ROUTES.PROFILE)

    // Assert
    guestPage.assertRedirectedToLogin()
    cy.url().should('match', /\/login$/)
  })

  it('CT-213-acao-privada-vai-para-login: sem login, curtir um evento pede conta e "Já tenho conta" leva a /login', () => {
    // Arrange
    guestPage.visitPublic(ROUTES.EXPLORE)

    // Act
    guestPage.likeFirstEventAsGuest()

    // Assert
    guestPage.assertLoginRequiredDialog()

    // Act
    guestPage.chooseAlreadyHaveAccount()

    // Assert
    guestPage.assertRedirectedToLogin()
  })
})
