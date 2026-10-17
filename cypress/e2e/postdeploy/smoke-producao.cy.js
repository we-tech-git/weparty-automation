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

  it('CT-164-prod-social-posts-guard: as rotas de social-posts existem e recusam acesso sem chave (401, não 404/500)', () => {
    // Act + Assert
    ;[['GET', '/social-posts/approved'], ['POST', '/social-posts'], ['POST', '/social-posts/00000000-0000-0000-0000-000000000000/claim']].forEach(([method, path]) => {
      cy.request({ method, url: `${Cypress.env('apiUrl')}${path}`, body: method === 'POST' ? {} : undefined, failOnStatusCode: false }).its('status').should('eq', 401)
    })
  })

  it('CT-165-prod-social-posts-chave: com a chave de integração, a lista de aprovados responde (somente leitura)', function () {
    if (!Cypress.env('prodSocialKey')) this.skip()
    // Act
    cy.request({ url: `${Cypress.env('apiUrl')}/social-posts/approved`, headers: { 'x-api-key': Cypress.env('prodSocialKey') }, log: false }).then((res) => {
      // Assert
      expect(res.status).to.eq(200)
      expect(res.body).to.be.an('array')
    })
  })

  it('CT-166-prod-social-posts-admin: o admin lista a fila e os publicados (somente leitura)', () => {
    // Arrange
    cy.request({ method: 'POST', url: `${Cypress.env('apiUrl')}/users/login`, body: { email: email(), password: senha() }, log: false }).then((login) => {
      const headers = { Authorization: `Bearer ${login.body.data.token}` }
      // Act + Assert
      ;['', '?status=PENDING_APPROVAL', '?status=PUBLISHED'].forEach((qs) => {
        cy.request({ url: `${Cypress.env('apiUrl')}/admin/social-posts${qs}`, headers }).then((res) => {
          expect(res.status, `GET /admin/social-posts${qs}`).to.eq(200)
          expect(res.body).to.be.an('array')
        })
      })
    })
  })

  it('CT-167-prod-cms-social-posts: a tela de social posts do CMS abre e a aba Publicados carrega sem erro', () => {
    // Act
    cy.visit(`${Cypress.env('prodCmsUrl')}/login`)
    cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email(), { log: false })
    cy.get('input[type="password"]').type(senha(), { log: false })
    cy.get('button[type="submit"]').click()
    cy.url({ timeout: 30000 }).should('not.include', '/login')
    cy.visit(`${Cypress.env('prodCmsUrl')}/cms/admin/social-posts`)

    // Assert
    cy.contains('button', 'Publicados', { timeout: 30000 }).should('be.visible').click()
    cy.contains(/erro|falha ao carregar/i).should('not.exist')
  })
})
