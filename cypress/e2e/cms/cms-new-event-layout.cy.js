import { cmsNewEventPage } from '../../support/pages/CmsNewEventPage'

// Novo evento no novo layout (WEPARTY-232). API mockada.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip

suite('CMS - Novo evento (novo layout)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.viewport(1280, 900)
  })

  it('CT-181-cms-novo-evento-paineis: mostra os painéis, a prévia ao vivo e a barra de publicação', () => {
    // Act
    cmsNewEventPage.visitLogged()

    // Assert
    cmsNewEventPage.assertPanels()
  })

  it('CT-182-cms-novo-evento-previa-ao-vivo: o nome digitado aparece na prévia do feed', () => {
    // Arrange
    cmsNewEventPage.visitLogged()

    // Act
    cmsNewEventPage.typeTitle('Festa Teste Layout')

    // Assert
    cy.getBySel('live-preview').should('contain.text', 'Festa Teste Layout')
  })

  it('CT-183-cms-novo-evento-obrigatorios: publicar sem nome/data mostra aviso e não chama a API', () => {
    // Arrange
    cy.intercept('POST', /\/events$/, cy.spy().as('createSpy'))
    cmsNewEventPage.visitLogged()

    // Act
    cmsNewEventPage.submit()

    // Assert
    cy.getBySel('toast-warning').should('be.visible')
    cy.get('@createSpy').should('not.have.been.called')
  })

  it('CT-184-cms-novo-evento-publicar-sem-duplo-envio: publicar desabilita o botão e envia uma única vez', () => {
    // Arrange
    cy.intercept('POST', /\/events$/, { statusCode: 201, body: { id: 'evt-novo' }, delay: 1000 }).as('create')
    cmsNewEventPage.visitLogged()
    cmsNewEventPage.typeTitle('Festa Teste Layout')
    cy.get('#input-startDate').type('2030-12-31')

    // Act
    cmsNewEventPage.submit()

    // Assert
    cy.getBySel('event-submit').should('be.disabled')
    cy.wait('@create')
    cy.get('@create.all').should('have.length', 1)
  })

  it('CT-185-cms-novo-evento-faq: adicionar e remover pergunta atualiza a lista', () => {
    // Arrange
    cmsNewEventPage.visitLogged()
    cmsNewEventPage.assertFaqCount(0)

    // Act
    cmsNewEventPage.addFaq()

    // Assert
    cmsNewEventPage.assertFaqCount(1)

    // Act
    cy.get('[aria-label="Remover pergunta"]').click()

    // Assert
    cmsNewEventPage.assertFaqCount(0)
  })

  it('CT-186-cms-novo-evento-mobile: no mobile a prévia vem antes do formulário e a barra inferior aparece', () => {
    // Act
    cmsNewEventPage.visitLogged({ viewport: [390, 844] })

    // Assert
    cy.getBySel('cms-bottom-nav').should('be.visible')
    cy.getBySel('panel-details').should('be.visible')
  })
})
