import { ROUTES } from '../../support/constants/routes'
import { updatesPage } from '../../support/pages/UpdatesPage'

// Página de Novidades (pública, só leitura): roda em produção e no ambiente local.
// Cobre os cenários WEPARTY-157 (acessar), 158 (scrollar) e 159 (sair da página).
describe('Novidades (/updates)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  it('CT-200-updates-acessar: a página de novidades abre sem login e mostra o conteúdo', () => {
    // Act
    updatesPage.visit()

    // Assert
    cy.title().should('contain', 'Novidades')
    cy.contains('Ver o que mudou').should('be.visible')
  })

  it('CT-201-updates-scroll: rolar com o mouse faz a página responder e chegar ao rodapé', () => {
    // Arrange
    updatesPage.visit()
    updatesPage.assertAtTop()

    // Act
    updatesPage.scrollToBottom()

    // Assert
    updatesPage.assertScrolledDown()
    updatesPage.assertFooterVisible()

    // Act (volta)
    updatesPage.scrollToTop()

    // Assert
    updatesPage.assertAtTop()
  })

  it('CT-202-updates-sair: o logo leva da página de novidades para a página inicial', () => {
    // Arrange
    updatesPage.visit()

    // Act
    updatesPage.goToHomeByLogo()

    // Assert
    cy.location('pathname').should('eq', ROUTES.HOME)
  })
})
