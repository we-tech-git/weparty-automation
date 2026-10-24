import { CMS_ROUTES } from '../constants/routes'

// Page Object do Início do produtor (`/cms/home`).
class CmsHomePage {
  visitLogged (options) {
    cy.cmsMockApi()
    cy.cmsVisitLogged(CMS_ROUTES.HOME, options)
    cy.getBySel('producer-home').should('be.visible')
  }

  kpi (id) { return cy.getBySel(`kpi-${id}`) }

  assertKpiValue (id, text) {
    this.kpi(id).should('contain.text', text)
  }

  assertSections () {
    cy.getBySel('home-kpis').should('be.visible')
    cy.getBySel('spotlight-card').should('be.visible')
    cy.getBySel('reach-chart').should('be.visible')
    cy.getBySel('engagement-funnel').should('be.visible')
    cy.getBySel('activity-inbox').should('be.visible')
  }

  clickCreateEvent () {
    cy.getBySel('home-create-event').hydrated().click()
  }
}

export const cmsHomePage = new CmsHomePage()
