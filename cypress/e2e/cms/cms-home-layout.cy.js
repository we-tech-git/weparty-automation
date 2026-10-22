import { cmsHomePage } from '../../support/pages/CmsHomePage'
import { cmsShellPage } from '../../support/pages/CmsShellPage'

// Início do produtor no novo layout (WEPARTY-232). API mockada.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip

suite('CMS - Início do produtor (novo layout)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('CT-170-cms-home-desktop: mostra indicadores, painéis e o menu lateral com Início ativo', () => {
    // Arrange + Act
    cy.viewport(1280, 900)
    cmsHomePage.visitLogged()

    // Assert
    cmsHomePage.assertSections()
    cmsShellPage.assertDesktopNav()
    cmsShellPage.assertActive('home')
    cmsHomePage.assertKpiValue('views', '7')
    cmsHomePage.assertKpiValue('likes', '3')
  })

  it('CT-171-cms-home-mobile: no mobile troca o menu lateral pela barra inferior', () => {
    // Arrange + Act
    cmsHomePage.visitLogged({ viewport: [390, 844] })

    // Assert
    cmsShellPage.assertMobileNav()
    cy.getBySel('home-kpis').should('be.visible')
  })

  it('CT-172-cms-home-metrica-ausente: métrica indisponível aparece como traço, nunca como zero', () => {
    // Arrange
    cy.fixture('cms/dashboard').then((body) => {
      const { totalShares, ...semShares } = body
      void totalShares
      cy.intercept('GET', /\/events\/my-dashboard/, { statusCode: 200, body: semShares }).as('cmsDashboard')
    })
    cy.intercept('GET', /\/events\/my-events/, { statusCode: 200, body: { events: [], total: 0, page: 1, limit: 100, totalPages: 1 } })

    // Act
    cy.cmsVisitLogged('/cms/home')

    // Assert
    cy.getBySel('kpi-shares').should('contain.text', '—').and('not.contain.text', '0')
  })

  it('CT-173-cms-home-criar-evento: o CTA principal leva ao formulário de novo evento', () => {
    // Arrange
    cy.viewport(1280, 900)
    cmsHomePage.visitLogged()

    // Act
    cmsHomePage.clickCreateEvent()

    // Assert
    cy.url().should('include', '/cms/producer/new-event')
  })

  it('CT-174-cms-home-admin-visivel-so-para-admin: seção de Administração some para quem não é admin', () => {
    // Arrange
    cy.viewport(1280, 900)
    cy.intercept('GET', /\/users\/[0-9a-f-]{36}$/, { statusCode: 200, body: { id: '11111111-1111-4111-8111-111111111111', roles: ['promoter'] } })

    // Act
    cmsHomePage.visitLogged({ roles: ['promoter'] })

    // Assert
    cmsShellPage.assertNavMissing('control-panel')
    cmsShellPage.assertNavMissing('users')
  })
})
