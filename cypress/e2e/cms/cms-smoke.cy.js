import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// CMS (Next.js) contra o ambiente local. O CMS tem URL base própria (Cypress.env('cmsUrl')) e, por padrão,
// aponta para api.dev.wepartyapp.com — por isso o primeiro teste garante que NENHUMA chamada vaza para um
// domínio real: sem isso uma suíte "verde" poderia estar testando o ambiente errado.
const suite = Cypress.env('local') && Cypress.env('cmsUrl') ? describe : describe.skip

suite('CMS - smoke (ambiente local)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('CT-150-cms-login-renderiza: a página de login do CMS carrega com e-mail e senha', () => {
    // Act
    cy.visit(`${Cypress.env('cmsUrl')}/login`)

    // Assert
    cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('CT-151-cms-login-admin-usa-api-local: login de admin no CMS funciona e só fala com a API local', () => {
    // Arrange
    const dominiosReais = []
    cy.intercept({ url: /wepartyapp\.com/ }, (req) => { dominiosReais.push(req.url) })
    cy.localUserEmail('admin').then((email) => {
      cy.visit(`${Cypress.env('cmsUrl')}/login`)

      // Act
      cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email)
      cy.get('input[type="password"]').type(LOCAL_TEST_PASSWORD)
      cy.get('button[type="submit"]').click()

      // Assert
      cy.url({ timeout: 30000 }).should('not.include', '/login')
      cy.then(() => {
        expect(dominiosReais, 'chamadas para domínios reais da We Party').to.have.length(0)
      })
    })
  })
})
