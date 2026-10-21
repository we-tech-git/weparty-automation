import { CMS_ROUTES } from '../constants/routes'

// Page Object da moderação de denúncias do CMS (`/cms/admin/reports`). A tela não tem
// data-testid: filtros são botões com o texto visível e o estado ativo aparece como fundo
// em gradiente; os cards são as caixas clicáveis da grade. Texto e estilo são o 3º nível da
// prioridade de seletores. Ver docs/dados-e-integracao.md.
class ReportsAdminPage {
  visit () {
    cy.visit(`${Cypress.env('cmsUrl')}${CMS_ROUTES.ADMIN_REPORTS}`)
    cy.contains('Moderação de denúncias', { timeout: 30000 }).should('be.visible')
  }

  // Filtros de tipo: Todas | Eventos | Comentários | Comentários de interesse
  tab (label) {
    return cy.contains('button', new RegExp(`^${label}$`))
  }

  // Filtros de status: Todos | Pendentes | Aceitas | Rejeitadas
  status (label) {
    return cy.contains('button', new RegExp(`^${label}$`))
  }

  cards () {
    return cy.get('div.grid > div.cursor-pointer')
  }

  assertActive (button) {
    button.should('have.css', 'background-image').and('include', 'linear-gradient')
  }

  assertInactive (button) {
    button.should('have.css', 'background-image', 'none')
  }
}

export const reportsAdminPage = new ReportsAdminPage()
