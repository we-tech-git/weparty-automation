// API do backend — leitura de eventos (rotas públicas). Roda só no ambiente local.
const suite = Cypress.env('local') ? describe : describe.skip

// A API devolve listas em envelopes variados (ver unwrapList no web-app).
const lista = (body, ...chaves) => {
  for (const origem of [body?.data, body]) {
    if (Array.isArray(origem)) return origem
    for (const k of chaves) if (Array.isArray(origem?.[k])) return origem[k]
  }
  return []
}

suite('API - Eventos (leitura)', () => {
  it('CT-120-api-eventos-lista: GET /events devolve eventos do dump', () => {
    // Act
    cy.apiRequest('GET', '/events').then((res) => {
      // Assert
      expect(res.status).to.eq(200)
      expect(lista(res.body, 'events', 'items', 'content')).to.have.length.greaterThan(0)
    })
  })

  ;['/events/trending', '/events/top', '/events/recommendations'].forEach((rota, i) => {
    it(`CT-121-api-eventos-listas-${i + 1}: ${rota} responde 200 sem token`, () => {
      // Act
      cy.apiRequest('GET', rota).then((res) => {
        // Assert
        expect(res.status).to.eq(200)
      })
    })
  })

  it('CT-122-api-evento-detalhe: GET /events/:id devolve o evento pedido', () => {
    // Arrange
    cy.localEventId().then((id) => {
      // Act
      cy.apiRequest('GET', `/events/${id}`).then((res) => {
        // Assert
        expect(res.status).to.eq(200)
        const ev = res.body?.data?.event ?? res.body?.data ?? res.body
        expect(ev.id).to.eq(id)
      })
    })
  })

  it('CT-123-api-evento-inexistente: id inexistente responde erro 4xx, nunca 5xx', () => {
    // Act
    cy.apiRequest('GET', '/events/00000000-0000-0000-0000-000000000000').then((res) => {
      // Assert
      expect(res.status).to.be.within(400, 499)
    })
  })
})
