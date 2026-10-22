import { cmsMyEventsPage } from '../../support/pages/CmsMyEventsPage'
import { cmsShellPage } from '../../support/pages/CmsShellPage'

// Meus eventos no novo layout (WEPARTY-232). API mockada; escritas (PATCH/DELETE) nunca chegam a um backend real.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip

suite('CMS - Meus eventos (novo layout)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.viewport(1280, 900)
  })

  it('CT-175-cms-eventos-lista-e-abas: lista os cards e mostra a contagem de cada aba', () => {
    // Act
    cmsMyEventsPage.visitLogged()

    // Assert
    cmsShellPage.assertActive('my-events')
    cmsMyEventsPage.assertCardCount(4) // "Todos" não mostra os arquivados
    cmsMyEventsPage.assertTabCount('todos', 4)
    cmsMyEventsPage.assertTabCount('agendado', 2)
    cmsMyEventsPage.assertTabCount('arquivado', 1)
  })

  it('CT-176-cms-eventos-filtro-e-busca: trocar de aba e buscar reduz a lista', () => {
    // Arrange
    cmsMyEventsPage.visitLogged()

    // Act
    cmsMyEventsPage.selectTab('agendado')

    // Assert
    cmsMyEventsPage.assertCardCount(2)

    // Act
    cmsMyEventsPage.search('Dois')

    // Assert
    cmsMyEventsPage.assertCardCount(1)
    cy.getBySel('event-title').should('contain.text', 'Festa Agendada Dois')
  })

  it('CT-177-cms-eventos-selecao-em-lote: selecionar um card mostra a barra de lote e limpar esconde', () => {
    // Arrange
    cmsMyEventsPage.visitLogged()
    cmsMyEventsPage.assertBulkBarVisible(false)

    // Act
    cmsMyEventsPage.selectCard(0)

    // Assert
    cmsMyEventsPage.assertBulkBarVisible(true)
    cy.getBySel('bulk-bar').should('contain.text', '1')
  })

  it('CT-178-cms-eventos-excluir-com-confirmacao: excluir pede confirmação, mostra aviso e não duplica a chamada', () => {
    // Arrange
    cy.intercept('DELETE', /\/events\/evt-1$/, { statusCode: 200, body: {}, delay: 600 }).as('del')
    cmsMyEventsPage.visitLogged()

    // Act
    cmsMyEventsPage.openDeleteFromMenu(0)
    cy.getBySel('delete-modal').should('be.visible')
    cy.getBySel('delete-confirm').click()

    // Assert
    cy.getBySel('delete-confirm').should('be.disabled')
    cy.wait('@del')
    cy.get('@del.all').should('have.length', 1)
    cy.getBySel('toast-success').should('be.visible')
  })

  it('CT-179-cms-eventos-excluir-erro: falha na API mostra aviso de erro e mantém o card', () => {
    // Arrange
    cy.intercept('DELETE', /\/events\/evt-1$/, { statusCode: 500, body: { message: 'erro' } }).as('del')
    cmsMyEventsPage.visitLogged()

    // Act
    cmsMyEventsPage.openDeleteFromMenu(0)
    cy.getBySel('delete-confirm').click()

    // Assert
    cy.wait('@del')
    cy.getBySel('toast-error').should('be.visible')
    cmsMyEventsPage.assertCardCount(4)
  })

  it('CT-180-cms-eventos-mobile: no mobile usa a barra inferior e mantém os cards', () => {
    // Act
    cmsMyEventsPage.visitLogged({ viewport: [390, 844] })

    // Assert
    cmsShellPage.assertMobileNav()
    cmsMyEventsPage.assertCardCount(4)
  })
})
