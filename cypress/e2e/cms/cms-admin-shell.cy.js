import { cmsShellPage } from '../../support/pages/CmsShellPage'

// Retroativo (WEPARTY-232): as telas de administração ainda não foram migradas para o visual B, mas passaram a
// morar dentro da nova casca (topo + menu lateral + barra inferior). Este spec garante que a casca nova
// funciona nelas — menu com o item certo ativo, sem quebrar o acesso. O conteúdo de cada tela é coberto
// pelos specs locais (cms-denuncias, cms-social-posts) e será migrado depois.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip

const ROTAS_NO_MENU = [
  ['control-panel', '/cms/admin/control-panel'],
  ['users', '/cms/admin/users'],
  ['reports', '/cms/admin/reports'],
  ['updates', '/cms/admin/updates'],
]

suite('CMS - casca nova nas telas de administração (retroativo)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.viewport(1280, 900)
    // O conteúdo não é o alvo: respostas vazias de API e tolerância a erro de renderização da tela interna.
    cy.intercept({ resourceType: 'xhr' }, { statusCode: 200, body: {} })
    cy.intercept({ resourceType: 'fetch' }, { statusCode: 200, body: {} })
    Cypress.on('uncaught:exception', () => false)
  })

  ROTAS_NO_MENU.forEach(([slug, rota]) => {
    it(`CT-187-cms-admin-casca-${slug}: ${rota} mostra a casca nova com o item do menu ativo`, () => {
      // Act
      cy.cmsVisitLogged(rota)

      // Assert
      cmsShellPage.topbar().should('be.visible')
      cmsShellPage.assertActive(slug)
    })
  })

  it('CT-188-cms-admin-menu-completo-para-admin: o menu lateral lista produtor e administração para admin', () => {
    // Act
    cy.cmsVisitLogged('/cms/admin/control-panel')

    // Assert
    ;['home', 'new-event', 'my-events', 'control-panel', 'users', 'reports', 'updates'].forEach((slug) => {
      cmsShellPage.sidebar().find(`[data-testid="nav-${slug}"]`).should('exist')
    })
  })

  it('CT-189-cms-admin-bloqueado-para-nao-admin: quem não é admin é levado ao Início ao abrir a administração', () => {
    // Arrange
    cy.intercept('GET', /\/users\/[0-9a-f-]{36}$/, { statusCode: 200, body: { id: '11111111-1111-4111-8111-111111111111', roles: ['promoter'] } })

    // Act
    cy.cmsVisitLogged('/cms/admin/users', { roles: ['promoter'] })

    // Assert
    cy.url({ timeout: 20000 }).should('include', '/cms/home')
  })
})
