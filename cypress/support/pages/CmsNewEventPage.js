import { CMS_ROUTES } from '../constants/routes'

// Page Object da criação de evento no CMS (`/cms/producer/new-event`), só a descrição.
// O campo não tem data-testid: usa o atributo maxlength (único textarea da tela com ele).
// Ver docs/dados-e-integracao.md.
class CmsNewEventPage {
  visit () {
    cy.visit(`${Cypress.env('cmsUrl')}${CMS_ROUTES.NEW_EVENT}`)
    this.description().should('be.visible')
    this.waitForHydration()
  }

  description () {
    return cy.get('textarea[maxlength="600"]')
  }

  // O CMS local roda em `next dev`: o HTML do servidor aparece antes de o React assumir a
  // página, e o que for digitado nesse intervalo fica só no DOM (o contador não vê). O React
  // marca os nós que já controla com `__reactFiber$...`; esperar por isso evita o falso negativo.
  waitForHydration () {
    this.description().should(($el) => {
      expect(Object.keys($el[0]).some((k) => k.startsWith('__reactFiber')), 'textarea hidratado pelo React').to.eq(true)
    })
  }

  typeDescription (text, options = {}) {
    this.description().clear().type(text, options)
  }

  assertCounter (used) {
    cy.contains(`${used}/600`).should('be.visible')
  }

  assertDescriptionLength (length) {
    this.description().invoke('val').should('have.length', length)
  }
}

export const cmsNewEventPage = new CmsNewEventPage()
