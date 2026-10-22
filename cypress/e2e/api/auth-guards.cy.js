import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// API do backend — autenticação e autorização (guards). Roda só no ambiente local.
const suite = Cypress.env('local') ? describe : describe.skip

const ROTAS_PRIVADAS = ['/events/likes', '/events/favorites', '/events/my-events', '/follow/my-followers', '/my-events/attending']

suite('API - Autenticação e autorização', () => {
  it('CT-110-api-login-sucesso: usuário do dump faz login e recebe token', () => {
    // Arrange
    cy.localUserEmail('user').then((email) => {
      // Act
      cy.apiRequest('POST', '/users/login', { body: { email, password: LOCAL_TEST_PASSWORD } }).then((res) => {
        // Assert
        expect(res.status).to.be.oneOf([200, 201])
        expect(res.body.success).to.eq(true)
        expect(res.body.data.token).to.be.a('string').and.not.be.empty
      })
    })
  })

  it('CT-111-api-login-senha-errada: senha errada falha sem token e sem erro 5xx', () => {
    // Arrange
    cy.localUserEmail('user').then((email) => {
      // Act
      cy.apiRequest('POST', '/users/login', { body: { email, password: 'senha-errada-123' } }).then((res) => {
        // Assert
        expect(res.status).to.be.within(400, 499)
        expect(res.body?.data?.token).to.be.undefined
      })
    })
  })

  ROTAS_PRIVADAS.forEach((rota, i) => {
    it(`CT-112-api-sem-token-${i + 1}: ${rota} sem token responde 401`, () => {
      // Act
      cy.apiRequest('GET', rota).then((res) => {
        // Assert
        expect(res.status).to.eq(401)
      })
    })
  })

  it('CT-113-api-token-invalido: token inválido responde 401', () => {
    // Act
    cy.apiRequest('GET', '/events/likes', { token: 'token.invalido.123' }).then((res) => {
      // Assert
      expect(res.status).to.eq(401)
    })
  })

  it('CT-114-api-papel-user-admin: usuário comum não acessa rota de admin (403)', () => {
    // Arrange
    cy.apiLogin('user').then(({ token }) => {
      // Act
      cy.apiRequest('GET', '/admin/stats', { token }).then((res) => {
        // Assert
        expect(res.status).to.eq(403)
      })
    })
  })

  it('CT-115-api-papel-admin: admin acessa rota de admin (200)', () => {
    // Arrange
    cy.apiLogin('admin').then(({ token }) => {
      // Act
      cy.apiRequest('GET', '/admin/stats', { token }).then((res) => {
        // Assert
        expect(res.status).to.eq(200)
      })
    })
  })

  it('CT-116-api-papel-user-criar-evento: usuário comum não cria evento (403)', () => {
    // Arrange
    cy.apiLogin('user').then(({ token }) => {
      // Act
      cy.apiRequest('POST', '/events', { token, body: {} }).then((res) => {
        // Assert
        expect(res.status).to.eq(403)
      })
    })
  })

  it('CT-117-api-usuario-bloqueado: usuário bloqueado não consegue logar', () => {
    // Arrange
    cy.dbQuery(`select email from "User" where "isBlocked" = true limit 1`).then((email) => {
      expect(email, 'usuário bloqueado no dump').to.not.be.empty
      // Act
      cy.apiRequest('POST', '/users/login', { body: { email, password: LOCAL_TEST_PASSWORD } }).then((res) => {
        // Assert
        expect(res.status).to.be.within(400, 499)
        expect(res.body?.data?.token).to.be.undefined
      })
    })
  })
})
