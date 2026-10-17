import { LOCAL_TEST_PASSWORD } from '../constants/local'

// Comandos para o ambiente LOCAL (dados reais anonimizados, escrita liberada). Em produção a suíte
// continua mockando tudo que altera estado — estes comandos exigem Cypress.env('local').
// Ver docs/dados-e-integracao.md.

Cypress.Commands.add('dbQuery', (sql) => cy.task('dbQuery', sql, { log: false }))

// E-mail de um usuário verificado e não bloqueado do dump, por papel (admin | promoter | user).
Cypress.Commands.add('localUserEmail', (role = 'user', offset = 0) =>
  cy.dbQuery(
    `select u.email from "User" u join "Role" r on r.id=u."roleId" where r.name='${role}' and not coalesce(u."isBlocked",false) and u."emailVerificationStatus"='verified' order by u."createdAt" offset ${offset} limit 1`,
  ),
)

// Chamada direta à API local (cy.request). Não falha por status HTTP: o teste decide.
Cypress.Commands.add('apiRequest', (method, path, { token, body, qs, headers } = {}) =>
  cy.request({
    method,
    url: `${Cypress.env('apiUrl')}${path}`,
    body,
    qs,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(headers || {}) },
    failOnStatusCode: false,
  }),
)

// Login real pela API como um usuário do dump. Entrega { token, email }.
Cypress.Commands.add('apiLogin', (role = 'user', offset = 0) =>
  cy.localUserEmail(role, offset).then((email) =>
    cy.apiRequest('POST', '/users/login', { body: { email, password: LOCAL_TEST_PASSWORD } }).then((res) => {
      expect(res.status, `login de ${role}`).to.be.oneOf([200, 201])
      const token = res.body?.data?.token
      expect(token, 'token no login').to.be.a('string').and.not.be.empty
      return { token, email }
    }),
  ),
)

// Primeiro evento do dump (id) — massa estável para os testes de leitura e engajamento.
Cypress.Commands.add('localEventId', (offset = 0) =>
  cy.dbQuery(`select id from "Event" order by "createdAt", id offset ${offset} limit 1`),
)
