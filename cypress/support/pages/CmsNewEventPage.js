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

  // --- novo layout (WEPARTY-232) ---
  visitLogged (options) {
    cy.cmsMockApi()
    cy.cmsVisitLogged(CMS_ROUTES.NEW_EVENT, options)
    cy.getBySel('panel-details').should('be.visible')
    this.waitForHydration()
  }

  assertPanels () {
    ;['panel-details', 'panel-datetime', 'panel-location', 'panel-interests', 'panel-faq'].forEach((id) => {
      cy.getBySel(id).should('exist')
    })
    cy.getBySel('cover-dropzone').should('exist')
    cy.getBySel('live-preview').should('exist')
    cy.getBySel('action-bar').should('exist')
  }

  typeTitle (text) { cy.getBySel('event-title-input').clear().type(text) }

  submit () { cy.getBySel('event-submit').click() }

  uploadCover (file) {
    cy.getBySel('cover-dropzone').find('input[type="file"]').selectFile(file, { force: true })
  }

  assertCoverRejected () { cy.getBySel('cover-rejected').should('be.visible') }

  assertCoverThumbnails (count) {
    if (count === 0) cy.getBySel('cover-dropzone').find('li').should('not.exist')
    else cy.getBySel('cover-dropzone').find('li').should('have.length', count)
  }

  addFaq () { cy.getBySel('faq-add').click() }

  assertFaqCount (count) {
    if (count === 0) cy.getBySel('faq-item').should('not.exist')
    else cy.getBySel('faq-item').should('have.length', count)
  }
}

export const cmsNewEventPage = new CmsNewEventPage()
