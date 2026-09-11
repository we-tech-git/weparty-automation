// Helper de seleção por data-testid — padrão-alvo de seletor do projeto.
// Ver docs/dados-e-integracao.md.
Cypress.Commands.add('getBySel', (testId, options) => {
  return cy.get(`[data-testid="${testId}"]`, options)
})
