import { CMS_ROUTES } from '../constants/routes'

// Page Object de "Meus eventos" (`/cms/producer/my-events`).
class CmsMyEventsPage {
  visitLogged (options) {
    cy.cmsMockApi()
    cy.cmsVisitLogged(CMS_ROUTES.MY_EVENTS, options)
    cy.getBySel('events-toolbar').should('be.visible')
  }

  cards () { return cy.getBySel('event-card') }

  selectTab (key) { cy.getBySel(`tab-${key}`).click() }

  search (text) { cy.getBySel('events-search').clear().type(text) }

  selectCard (index) { this.cards().eq(index).find('[data-testid="event-select"]').click() }

  openDeleteFromMenu (index) {
    this.cards().eq(index).find('[data-testid="event-menu"]').click()
    cy.getBySel('event-delete').click()
  }

  assertCardCount (count) { this.cards().should('have.length', count) }

  assertTabCount (key, count) { cy.getBySel(`tab-${key}`).should('contain.text', `· ${count}`) }

  assertBulkBarVisible (visible = true) {
    cy.getBySel('bulk-bar').should('have.attr', 'aria-hidden', visible ? 'false' : 'true')
  }
}

export const cmsMyEventsPage = new CmsMyEventsPage()
