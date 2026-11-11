import { CMS_ROUTES } from '../constants/routes'

// Page Object da edição de evento no CMS (`/cms/producer/edit-event/:id`), seção
// "Links de divulgação" (WEPARTY-239). Seletores por data-testid `tracking-links-*`.
class CmsEditEventPage {
  /** Mocka o evento e a lista de links e entra logado como promoter. */
  visitMocked (eventId, { links = 'cms/tracking-links', linksStatus = 200, viewport } = {}) {
    cy.cmsMockApi()
    // O token do fixture não vale no backend real: qualquer 401 derruba a sessão do CMS.
    cy.fixture('cms/login-success').then(({ data }) => {
      const { token, apiKey, passwordResetToken, googleId, ...user } = data
      void token; void apiKey; void passwordResetToken; void googleId
      cy.intercept('GET', new RegExp(`/users/${user.id}(\\?.*)?$`), { statusCode: 200, body: user })
    })
    cy.fixture('cms/event-detail').then((event) => {
      cy.intercept('GET', new RegExp(`/events/${eventId}$`), { statusCode: 200, body: { ...event, id: eventId } }).as('cmsEvent')
    })
    if (linksStatus === 200) {
      cy.fixture(links).then((body) => {
        cy.intercept('GET', new RegExp(`/events/${eventId}/tracking-links$`), { statusCode: 200, body }).as('trackingLinks')
      })
    } else {
      cy.intercept('GET', new RegExp(`/events/${eventId}/tracking-links$`), { statusCode: linksStatus, body: {} }).as('trackingLinks')
    }
    cy.cmsVisitLogged(`${CMS_ROUTES.EDIT_EVENT}/${eventId}`, { roles: ['promoter'], viewport })
    cy.getBySel('panel-details').should('be.visible')
  }

  /** Entra no CMS pela tela de login (ambiente local, sem mocks) e abre a edição do evento. */
  visitReal (eventId, email, password) {
    cy.visit(`${Cypress.env('cmsUrl')}${CMS_ROUTES.LOGIN}`)
    cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 30000 }).should('not.include', CMS_ROUTES.LOGIN)
    cy.visit(`${Cypress.env('cmsUrl')}${CMS_ROUTES.EDIT_EVENT}/${eventId}`)
    cy.getBySel('tracking-links-section', { timeout: 30000 }).should('be.visible')
  }

  section () { return cy.getBySel('tracking-links-section') }

  items () { return cy.getBySel('tracking-links-item') }

  item (label) { return cy.contains('[data-testid="tracking-links-item"]', label) }

  createLink (label) {
    cy.getBySel('tracking-links-label-input').hydrated().clear().type(label)
    cy.getBySel('tracking-links-create').should('be.enabled').click()
  }

  copy (label) { this.item(label).find('[data-testid="tracking-links-copy"]').hydrated().click() }

  remove (label) { this.item(label).find('[data-testid="tracking-links-remove"]').hydrated().click() }

  confirmRemove () { cy.getBySel('delete-confirm').click() }

  cancelRemove () { cy.getBySel('delete-cancel').click() }

  /** Troca `navigator.clipboard.writeText` por um stub (`@clipboard`). */
  stubClipboard () {
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves().as('clipboard')
    })
  }

  assertItem (label, { views, urlIncludes }) {
    this.item(label).within(() => {
      cy.getBySel('tracking-links-views').should('contain.text', `${views} `)
      if (urlIncludes) cy.getBySel('tracking-links-url').should('contain.text', urlIncludes)
    })
  }

  assertToast (type, text) {
    cy.getBySel(`toast-${type}`).should('be.visible').and('contain.text', text)
  }
}

export const cmsEditEventPage = new CmsEditEventPage()
