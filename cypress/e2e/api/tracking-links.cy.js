// API do backend — links de divulgação por canal (WEPARTY-239). ALTERA estado: só no ambiente local,
// conferindo no banco. Com FEATURE_TRACKING_LINKS ligada roda o fluxo completo; desligada, só o
// cenário de flag desligada (as rotas somem com 404 e o ?ref= é ignorado).
const suite = Cypress.env('local') ? describe : describe.skip
const flagOn = Cypress.env('featureTrackingLinks')
const whenOn = flagOn ? it : it.skip
const whenOff = flagOn ? it.skip : it

const CODE_PATTERN = /^[a-km-np-z2-9]{8}$/
const HOJE_BRASILIA = `(now() at time zone 'America/Sao_Paulo')::date`

suite('API - Links de divulgação (WEPARTY-239)', () => {
  let eventId
  let dono
  let outroPromoter
  let outroAdmin
  let emailPromovido
  let visitante

  const linksPath = () => `/events/${eventId}/tracking-links`
  const limparLinks = () => cy.dbQuery(`delete from "EventTrackingLink" where "eventId"='${eventId}'`)
  const contagemHoje = (code) =>
    cy.dbQuery(`select coalesce(sum(count),0) from "EventSourceDailyView" where "eventId"='${eventId}' and code='${code}' and day=${HOJE_BRASILIA}`).then(Number)
  const contagemDoEvento = () =>
    cy.dbQuery(`select coalesce(sum(count),0) from "EventSourceDailyView" where "eventId"='${eventId}'`).then(Number)
  const criarLink = (label = 'Instagram') =>
    cy.apiRequest('POST', linksPath(), { token: dono.token, body: { label } }).then((res) => {
      expect(res.status, 'criar link').to.eq(201)
      return res.body
    })

  const trocarPapel = (email, papel) =>
    cy.dbQuery(`update "User" set "roleId"=(select id from "Role" where name='${papel}') where email='${email}'`)

  before(() => {
    cy.localOwnedEvent().then((evt) => {
      eventId = evt.eventId
      cy.apiLoginEmail(evt.ownerEmail).then((s) => { dono = s })
      cy.dbQuery(
        `select u.email from "User" u join "Role" r on r.id=u."roleId" where r.name='admin' and u.email<>'${evt.ownerEmail}' and not coalesce(u."isBlocked",false) and u."emailVerificationStatus"='verified' order by u."createdAt" limit 1`,
      ).then((email) => cy.apiLoginEmail(email)).then((s) => { outroAdmin = s })
    })
    cy.apiLogin('user', 1).then((s) => { visitante = s })
    // O dump não tem promoter: um usuário comum vira promoter só durante o spec (desfeito no after).
    cy.localUserEmail('user', 10).then((email) => {
      emailPromovido = email
      trocarPapel(email, 'promoter')
      cy.apiLoginEmail(email).then((s) => { outroPromoter = s })
    })
  })

  beforeEach(() => {
    if (eventId) limparLinks()
  })

  after(() => {
    if (eventId) limparLinks()
    if (emailPromovido) trocarPapel(emailPromovido, 'user')
  })

  whenOn('CT-273-api-tracking-criar: dono cria link "Instagram" com code de 8 chars e totalViews=0', () => {
    // Arrange + Act
    criarLink('Instagram').then((link) => {
      // Assert
      expect(link.label).to.eq('Instagram')
      expect(link.code).to.match(CODE_PATTERN)
      expect(link.totalViews).to.eq(0)
      cy.dbQuery(`select label from "EventTrackingLink" where code='${link.code}' and "eventId"='${eventId}'`).should('eq', 'Instagram')
    })
  })

  whenOn('CT-274-api-tracking-autorizacao: sem login 401; promoter ou admin que não é dono recebe 403 em GET/POST/DELETE', () => {
    // Arrange
    criarLink().then((link) => {
      // Act + Assert
      cy.apiRequest('GET', linksPath()).its('status').should('eq', 401)
      ;[outroPromoter, outroAdmin].forEach(({ token }) => {
        cy.apiRequest('GET', linksPath(), { token }).its('status').should('eq', 403)
        cy.apiRequest('POST', linksPath(), { token, body: { label: 'Intruso' } }).its('status').should('eq', 403)
        cy.apiRequest('DELETE', `${linksPath()}/${link.id}`, { token }).its('status').should('eq', 403)
      })
      cy.dbQuery(`select count(*) from "EventTrackingLink" where "eventId"='${eventId}'`).then(Number).should('eq', 1)
    })
  })

  whenOn('CT-275-api-tracking-contagem: visitante logado com ref válido soma 1 por abertura no dia de Brasília', () => {
    // Arrange
    criarLink().then((link) => {
      // Act
      cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token, qs: { ref: link.code } }).its('status').should('eq', 200)
      // Assert
      contagemHoje(link.code).should('eq', 1)
      // Act (segunda abertura)
      cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token, qs: { ref: link.code } }).its('status').should('eq', 200)
      // Assert
      contagemHoje(link.code).should('eq', 2)
    })
  })

  whenOn('CT-276-api-tracking-ref-invalido: ref inexistente, malformado ou ausente não grava nada e responde igual', () => {
    // Arrange
    criarLink().then(() => {
      // Act
      ;['zzzzzzzz', 'ABC', '../../x'].forEach((ref) => {
        cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token, qs: { ref } }).then((res) => {
          expect(res.status, `ref=${ref}`).to.eq(200)
          expect(res.body?.id ?? res.body?.data?.id).to.eq(eventId)
        })
      })
      cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token }).its('status').should('eq', 200)
      // Assert
      contagemDoEvento().should('eq', 0)
    })
  })

  whenOn('CT-277-api-tracking-dono-nao-conta: dono abrindo o evento com ref não soma nada', () => {
    // Arrange
    criarLink().then((link) => {
      // Act
      cy.apiRequest('GET', `/events/${eventId}`, { token: dono.token, qs: { ref: link.code } }).its('status').should('eq', 200)
      // Assert
      contagemHoje(link.code).should('eq', 0)
    })
  })

  whenOn('CT-278-api-tracking-total: link com 3+4 visitas em dois dias mostra 7; link novo mostra 0', () => {
    // Arrange
    criarLink('Instagram').then((insta) => {
      cy.dbQuery(
        `insert into "EventSourceDailyView" ("eventId", code, day, count) values ('${eventId}','${insta.code}',${HOJE_BRASILIA} - 1,3), ('${eventId}','${insta.code}',${HOJE_BRASILIA},4)`,
      )
      criarLink('WhatsApp').then(() => {
        // Act
        cy.apiRequest('GET', linksPath(), { token: dono.token }).then((res) => {
          // Assert
          expect(res.status).to.eq(200)
          const porRotulo = Object.fromEntries(res.body.map((l) => [l.label, l.totalViews]))
          expect(porRotulo).to.deep.eq({ Instagram: 7, WhatsApp: 0 })
        })
      })
    })
  })

  whenOn('CT-279-api-tracking-remover: remover apaga o link e as contagens dele', () => {
    // Arrange
    criarLink().then((link) => {
      cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token, qs: { ref: link.code } })
      contagemHoje(link.code).should('eq', 1)
      // Act
      cy.apiRequest('DELETE', `${linksPath()}/${link.id}`, { token: dono.token }).its('status').should('eq', 200)
      // Assert
      cy.dbQuery(`select count(*) from "EventTrackingLink" where id='${link.id}'`).then(Number).should('eq', 0)
      cy.dbQuery(`select count(*) from "EventSourceDailyView" where code='${link.code}'`).then(Number).should('eq', 0)
    })
  })

  whenOn('CT-280-api-tracking-validacao: rótulo vazio ou com 61 caracteres e o 51º link recebem 400', () => {
    // Arrange + Act + Assert (rótulo)
    ;['', '   ', 'x'.repeat(61)].forEach((label) => {
      cy.apiRequest('POST', linksPath(), { token: dono.token, body: { label } }).its('status').should('eq', 400)
    })
    // Arrange (50 links direto no banco)
    cy.dbQuery(
      `insert into "EventTrackingLink" (id, "eventId", label, code) select gen_random_uuid()::text, '${eventId}', 'L' || g, substr(md5(random()::text || g), 1, 8) from generate_series(1, 50) g`,
    )
    // Act + Assert (51º)
    cy.apiRequest('POST', linksPath(), { token: dono.token, body: { label: 'Excedente' } }).its('status').should('eq', 400)
    cy.dbQuery(`select count(*) from "EventTrackingLink" where "eventId"='${eventId}'`).then(Number).should('eq', 50)
  })

  it('CT-281-api-evento-usuario-bloqueado: usuário bloqueado com token recebe 403 em GET /events/:id', () => {
    // Arrange
    cy.apiLogin('user', 2).then(({ token, email }) => {
      cy.dbQuery(`update "User" set "isBlocked"=true where email='${email}'`)
      // Act
      cy.apiRequest('GET', `/events/${eventId}`, { token }).then((res) => {
        // Arrange (desfaz antes de afirmar: o usuário volta ao estado original mesmo se falhar)
        cy.dbQuery(`update "User" set "isBlocked"=false where email='${email}'`)
        // Assert
        expect(res.status).to.eq(403)
      })
    })
  })

  whenOff('CT-282-api-tracking-flag-desligada: rotas respondem 404 e o ref é ignorado', () => {
    // Arrange
    cy.dbQuery(`insert into "EventTrackingLink" (id, "eventId", label, code) values (gen_random_uuid()::text, '${eventId}', 'Flag off', 'fagkff23')`)
    // Act + Assert
    cy.apiRequest('GET', linksPath(), { token: dono.token }).its('status').should('eq', 404)
    cy.apiRequest('POST', linksPath(), { token: dono.token, body: { label: 'X' } }).its('status').should('eq', 404)
    cy.apiRequest('GET', `/events/${eventId}`, { token: visitante.token, qs: { ref: 'fagkff23' } }).its('status').should('eq', 200)
    contagemDoEvento().should('eq', 0)
  })
})
