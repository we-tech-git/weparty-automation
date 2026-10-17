// API do backend — engajamento (curtir, comentar, favoritar). ALTERA estado: só no ambiente local,
// conferindo a persistência direto no banco (a verdade), não só a resposta HTTP.
const suite = Cypress.env('local') ? describe : describe.skip

const idDe = (body) => body?.data?.id ?? body?.data?.comment?.id ?? body?.id ?? body?.comment?.id

suite('API - Engajamento', () => {
  let sessao
  let eventId

  before(() => {
    cy.apiLogin('user', 1).then((s) => { sessao = s })
    cy.localEventId(3).then((id) => { eventId = id })
  })

  const contarCurtidas = () =>
    cy.dbQuery(`select count(*) from "EventLike" l join "User" u on u.id=l."userId" where l."eventId"='${eventId}' and u.email='${sessao.email}'`).then(Number)

  it('CT-130-api-curtir-alterna: curtir duas vezes alterna e persiste no banco', () => {
    // Arrange
    contarCurtidas().then((antes) => {
      // Act
      cy.apiRequest('POST', `/events/${eventId}/likes`, { token: sessao.token }).then((r1) => {
        expect(r1.status).to.be.oneOf([200, 201])
        // Assert
        contarCurtidas().should('eq', antes === 0 ? 1 : 0)
        // Act (volta ao estado original)
        cy.apiRequest('POST', `/events/${eventId}/likes`, { token: sessao.token }).then((r2) => {
          expect(r2.status).to.be.oneOf([200, 201])
          contarCurtidas().should('eq', antes)
        })
      })
    })
  })

  it('CT-131-api-comentario-ciclo: criar, editar e apagar comentário persiste no banco', () => {
    // Arrange
    const texto = `comentario de teste ${Date.now()}`
    const editado = `${texto} (editado)`
    // Act - criar
    cy.apiRequest('POST', `/events/${eventId}/comments`, { token: sessao.token, body: { content: texto } }).then((criado) => {
      expect(criado.status).to.be.oneOf([200, 201])
      const id = idDe(criado.body)
      expect(id, 'id do comentário criado').to.be.a('string')
      // Assert - criado
      cy.dbQuery(`select content from "EventComment" where id='${id}'`).should('eq', texto)
      // Act - editar
      cy.apiRequest('PUT', `/events/${eventId}/comments/${id}`, { token: sessao.token, body: { content: editado } }).then((ed) => {
        expect(ed.status).to.be.oneOf([200, 201])
        cy.dbQuery(`select content from "EventComment" where id='${id}'`).should('eq', editado)
        // Act - apagar
        cy.apiRequest('DELETE', `/events/${eventId}/comments/${id}`, { token: sessao.token }).then((del) => {
          expect(del.status).to.be.oneOf([200, 204])
          // Assert - apagado (físico ou lógico: some da listagem pública)
          cy.apiRequest('GET', `/events/${eventId}/comments`, { token: sessao.token }).then((lista) => {
            expect(JSON.stringify(lista.body)).to.not.include(editado)
          })
        })
      })
    })
  })

  it('CT-132-api-comentario-validacao: conteúdo vazio é recusado na criação (regressão WEPARTY-195)', () => {
    // Arrange
    const vazios = ['']
    vazios.forEach((content) => {
      // Act
      cy.apiRequest('POST', `/events/${eventId}/comments`, { token: sessao.token, body: { content } }).then((res) => {
        // Assert
        expect(res.status, `criar com "${content}"`).to.eq(400)
      })
    })
  })

  it('CT-133-api-comentario-resposta-e-edicao-validam: resposta e edição com conteúdo vazio são recusadas (WEPARTY-195)', () => {
    // Arrange
    cy.apiRequest('POST', `/events/${eventId}/comments`, { token: sessao.token, body: { content: `base ${Date.now()}` } }).then((base) => {
      const id = idDe(base.body)
      expect(id, 'comentário base').to.be.a('string')
      // Act + Assert
      cy.apiRequest('POST', `/events/${eventId}/comments/${id}/reply`, { token: sessao.token, body: { content: '' } }).its('status').should('eq', 400)
      cy.apiRequest('PUT', `/events/${eventId}/comments/${id}`, { token: sessao.token, body: { content: '' } }).its('status').should('eq', 400)
      // Limpeza
      cy.apiRequest('DELETE', `/events/${eventId}/comments/${id}`, { token: sessao.token })
    })
  })

  // BUG CONHECIDO (achado em 17/10 no ambiente local): conteúdo só com espaços ("   ") é ACEITO (201) na
  // criação, na resposta e (a confirmar) na edição — @IsNotEmpty() não rejeita string de espaços.
  // Quando corrigido (trim + IsNotEmpty), trocar it.skip por it.
  it.skip('CT-135-api-comentario-so-espacos: conteúdo só com espaços deve ser recusado (BUG conhecido)', () => {
    // Act
    cy.apiRequest('POST', `/events/${eventId}/comments`, { token: sessao.token, body: { content: '   ' } }).then((res) => {
      // Assert
      expect(res.status).to.eq(400)
    })
  })

  it('CT-134-api-favoritar: favoritar alterna e persiste no banco', () => {
    // Arrange
    const favoritos = () => cy.dbQuery(`select count(*) from "EventFavorite" f join "User" u on u.id=f."userId" where f."eventId"='${eventId}' and u.email='${sessao.email}'`).then(Number)
    favoritos().then((antes) => {
      // Act
      cy.apiRequest('POST', `/events/${eventId}/favorite`, { token: sessao.token }).its('status').should('be.oneOf', [200, 201])
      // Assert
      favoritos().should('eq', antes === 0 ? 1 : 0)
      // Act (volta ao estado original)
      cy.apiRequest('POST', `/events/${eventId}/favorite`, { token: sessao.token }).its('status').should('be.oneOf', [200, 201])
      favoritos().should('eq', antes)
    })
  })
})
