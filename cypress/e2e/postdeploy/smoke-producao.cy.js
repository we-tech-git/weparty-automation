import { feedPage } from '../../support/pages/FeedPage'
import { loginPage } from '../../support/pages/LoginPage'

// Smoke pós-deploy em PRODUÇÃO. Somente leitura: nada é criado, alterado nem apagado.
// Roda só quando o agente dev aciona (CYPRESS_postdeploy=1) depois que um PR é mergeado e o deploy conclui.
// Credenciais e URLs vêm de variáveis CYPRESS_* (nunca versionadas): prodEmail, prodPassword, prodCmsUrl, apiUrl.
const suite = Cypress.env('postdeploy') ? describe : describe.skip

suite('Pós-deploy - produção (somente leitura)', () => {
  const email = () => Cypress.env('prodEmail')
  const senha = () => Cypress.env('prodPassword')

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  it('CT-160-prod-api-saude: a API responde saudável e publica o Swagger', () => {
    // Act
    cy.request(`${Cypress.env('apiUrl')}/health`).then((res) => {
      // Assert
      expect(res.status).to.eq(200)
      expect(res.body.status).to.eq('ok')
    })
    cy.request(`${Cypress.env('apiUrl')}/api-json`).its('status').should('eq', 200)
  })

  it('CT-161-prod-api-login-e-leitura: login real devolve token e as listas públicas respondem', () => {
    // Act
    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/users/login`, body: { email: email(), password: senha() }, failOnStatusCode: false, log: false }).then((res) => {
      // Assert
      expect(res.status, 'login').to.be.oneOf([200, 201])
      expect(res.body?.data?.token, 'token').to.be.a('string').and.not.be.empty
    })
    cy.request(`${Cypress.env('apiUrl')}/events`).its('status').should('eq', 200)
    cy.request(`${Cypress.env('apiUrl')}/events/trending`).its('status').should('eq', 200)
  })

  it('CT-162-prod-webapp-login-e-feed: o web-app abre, aceita o login e mostra o feed com eventos', () => {
    // Act
    loginPage.visit()
    cy.getBySel('login-email').type(email(), { log: false })
    cy.getBySel('login-password').type(senha(), { log: false })
    loginPage.submit()

    // Assert
    loginPage.assertRedirectedToFeed()
    feedPage.assertLoaded()
  })

  it('CT-163-prod-cms-login: o CMS abre, aceita o login do admin e sai da tela de login', () => {
    // Act
    cy.visit(`${Cypress.env('prodCmsUrl')}/login`)
    cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email(), { log: false })
    cy.get('input[type="password"]').type(senha(), { log: false })
    cy.get('button[type="submit"]').click()

    // Assert
    cy.url({ timeout: 30000 }).should('not.include', '/login')
  })
})
