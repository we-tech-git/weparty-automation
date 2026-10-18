// API do backend — saúde e contrato publicado. Roda só no ambiente local (Cypress.env('local')).
const suite = Cypress.env('local') ? describe : describe.skip

suite('API - Saúde', () => {
  it('CT-100-api-health: /health responde 200 com state ok e sem o campo status', () => {
    // Act
    cy.apiRequest('GET', '/health').then((res) => {
      // Assert
      expect(res.status).to.eq(200)
      expect(res.body.state).to.eq('ok')
      expect(res.body).to.not.have.property('status')
      expect(res.body.timestamp).to.be.a('string')
    })
  })

  it('CT-101-api-contrato: o OpenAPI publica as rotas principais', () => {
    // Act
    cy.apiRequest('GET', '/api-json').then((res) => {
      // Assert
      expect(res.status).to.eq(200)
      const paths = Object.keys(res.body.paths)
      ;['/users/login', '/events', '/events/{id}', '/events/{eventId}/likes', '/events/{eventId}/comments'].forEach((p) => {
        expect(paths, `rota ${p}`).to.include(p)
      })
    })
  })
})
