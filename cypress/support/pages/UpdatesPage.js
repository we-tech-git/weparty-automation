import { ROUTES } from '../constants/routes'

// Page Object da página de Novidades (`/updates`, pública). Sem data-testid no
// componente: usa o landmark `main#main-content` e o `aria-label` do logo (2º nível
// da prioridade de seletores). Ver docs/dados-e-integracao.md.
class UpdatesPage {
  visit () {
    cy.visit(ROUTES.UPDATES)
    this.assertLoaded()
  }

  assertLoaded () {
    cy.location('pathname').should('eq', ROUTES.UPDATES)
    cy.get('main#main-content').should('be.visible')
    cy.contains('A WeParty não para de evoluir.').should('be.visible')
  }

  scrollToBottom () {
    cy.scrollTo('bottom', { duration: 600 })
  }

  scrollToTop () {
    cy.scrollTo('top', { duration: 600 })
  }

  assertScrolledDown () {
    cy.window().its('scrollY').should('be.greaterThan', 0)
  }

  assertAtTop () {
    cy.window().its('scrollY').should('eq', 0)
  }

  assertFooterVisible () {
    cy.get('footer.updates-footer').should('be.visible')
  }

  goToHomeByLogo () {
    cy.get('[aria-label="We Party - Ir para a página inicial"]').click()
  }
}

export const updatesPage = new UpdatesPage()
