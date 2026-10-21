import { ROUTES } from '../constants/routes'

// Page Object da página pública de um interesse (`/interests/:slug`) e do atalho para ela
// na tela de perfil. A página não expõe data-testid na raiz: o título do documento
// (`<nome do interesse> | We Party`, definido ao carregar) é o sinal de que o interesse abriu.
// Ver docs/dados-e-integracao.md.
class InterestPage {
  // Tags de interesse do perfil do próprio usuário (Profile.vue).
  profileTag (name) {
    return cy.contains('[data-testid="profile-interest-tag"]', name)
  }

  openFromProfile (name) {
    this.profileTag(name).click()
  }

  assertOpened (name) {
    cy.location('pathname').should('match', new RegExp(`^${ROUTES.INTEREST_PREFIX}[^/]+$`))
    cy.title().should('contain', name).and('contain', 'We Party')
  }

  scrollToBottom () {
    cy.scrollTo('bottom', { duration: 600 })
  }

  assertScrolledDown () {
    cy.window().its('scrollY').should('be.greaterThan', 0)
  }
}

export const interestPage = new InterestPage()
