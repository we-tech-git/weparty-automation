import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'
import { reportsAdminPage } from '../../support/pages/ReportsAdminPage'

// Moderação de denúncias do CMS (admin), contra o ambiente local. Os filtros de tipo e de
// status são botões da própria tela; o teste confere que cada um fica ativo e que a lista
// mostra só o que o filtro promete. Cobre os cenários WEPARTY-170 a 176.
const suite = Cypress.env('local') && Cypress.env('cmsUrl') ? describe : describe.skip

suite('CMS - moderação de denúncias (ambiente local)', () => {
  const idDe = (body) => body?.data?.id ?? body?.data?.comment?.id ?? body?.id ?? body?.comment?.id

  // Garante, por API, denúncias dos três tipos e dos três status (o dump traz só parte).
  // Idempotente: se a denúncia já existir, a API responde 400 e o teste segue.
  before(() => {
    cy.apiLogin('admin').then((admin) => {
      cy.apiLogin('user', 3).then((autor) => {
        cy.apiLogin('user', 4).then((denunciante) => {
          cy.localEventId(5).then((eventoId) => {
            cy.apiRequest('POST', '/reports', { token: denunciante.token, body: { type: 'EVENT', eventId: eventoId, reason: 'CT-denuncias' } })
          })

          cy.localEventId(6).then((eventoId) => {
            cy.apiRequest('POST', `/events/${eventoId}/comments`, { token: autor.token, body: { content: `comentario denunciado ${Date.now()}` } }).then((c) => {
              cy.apiRequest('POST', '/reports', { token: denunciante.token, body: { type: 'COMMENT', commentId: idDe(c.body), reason: 'CT-denuncias' } }).then((r) => {
                if (r.status === 201) {
                  cy.apiRequest('PATCH', `/reports/${idDe(r.body)}`, { token: admin.token, body: { status: 'ACCEPTED' } }).its('status').should('eq', 200)
                }
              })
            })
          })

          cy.dbQuery(`select id from "Interest" where status='APPROVED' order by "createdAt" limit 1`).then((interestId) => {
            cy.apiRequest('POST', `/interest/${interestId}/comments`, { token: autor.token, body: { content: `comentario de interesse denunciado ${Date.now()}` } }).then((c) => {
              cy.apiRequest('POST', '/reports', { token: denunciante.token, body: { type: 'INTEREST_COMMENT', interestCommentId: idDe(c.body), reason: 'CT-denuncias' } })
            })
          })
        })
      })
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.localUserEmail('admin').then((email) => {
      cy.visit(`${Cypress.env('cmsUrl')}/login`)
      cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email)
      cy.get('input[type="password"]').type(LOCAL_TEST_PASSWORD)
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 30000 }).should('not.include', '/login')
    })
    reportsAdminPage.visit()
  })

  it('CT-240-denuncias-todas: a página abre em "Todas" e "Todos" e lista denúncias de mais de um tipo', () => {
    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.tab('Todas'))
    reportsAdminPage.assertActive(reportsAdminPage.status('Todos'))
    reportsAdminPage.cards().should('have.length.at.least', 3)
    reportsAdminPage.cards().then(($c) => {
      const texto = $c.text()
      expect(texto, 'tem evento').to.match(/Evento ·/)
      expect(texto, 'tem comentário').to.match(/Comentário ·/)
    })
  })

  it('CT-241-denuncias-eventos: o filtro "Eventos" mostra só denúncias de evento', () => {
    // Act
    reportsAdminPage.tab('Eventos').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.tab('Eventos'))
    reportsAdminPage.assertInactive(reportsAdminPage.tab('Todas'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => expect($c.text()).to.match(/Evento ·/))
  })

  it('CT-242-denuncias-comentarios: o filtro "Comentários" mostra só denúncias de comentário', () => {
    // Act
    reportsAdminPage.tab('Comentários').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.tab('Comentários'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => {
      expect($c.text()).to.match(/Comentário ·/)
      expect($c.text()).not.to.match(/Evento ·/)
    })
  })

  it('CT-243-denuncias-comentarios-de-interesse: o filtro "Comentários de interesse" mostra só denúncias desse tipo', () => {
    // Act
    reportsAdminPage.tab('Comentários de interesse').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.tab('Comentários de interesse'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => {
      expect($c.text()).not.to.match(/Evento ·/)
      expect($c.text()).not.to.match(/Comentário ·/)
    })
  })

  it('CT-244-denuncias-pendentes: o filtro "Pendentes" mostra só denúncias pendentes', () => {
    // Act
    reportsAdminPage.status('Pendentes').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.status('Pendentes'))
    reportsAdminPage.assertInactive(reportsAdminPage.status('Todos'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => {
      expect($c.text()).to.match(/Pendente/)
      expect($c.text()).not.to.match(/Aceita|Rejeitada/)
    })
  })

  it('CT-245-denuncias-aceitas: o filtro "Aceitas" mostra só denúncias aceitas', () => {
    // Act
    reportsAdminPage.status('Aceitas').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.status('Aceitas'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => {
      expect($c.text()).to.match(/Aceita/)
      expect($c.text()).not.to.match(/Pendente|Rejeitada/)
    })
  })

  it('CT-246-denuncias-rejeitadas: o filtro "Rejeitadas" mostra só denúncias rejeitadas', () => {
    // Act
    reportsAdminPage.status('Rejeitadas').click()

    // Assert
    reportsAdminPage.assertActive(reportsAdminPage.status('Rejeitadas'))
    reportsAdminPage.cards().should('have.length.at.least', 1)
    reportsAdminPage.cards().each(($c) => {
      expect($c.text()).to.match(/Rejeitada/)
      expect($c.text()).not.to.match(/Pendente|Aceita/)
    })
  })
})
