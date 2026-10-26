// Helper de seleção por data-testid — padrão-alvo de seletor do projeto.
// Ver docs/dados-e-integracao.md.
Cypress.Commands.add('getBySel', (testId, options) => {
  return cy.get(`[data-testid="${testId}"]`, options)
})

// O CMS é Next.js: no servidor de desenvolvimento a página chega como HTML antes de o React hidratar, e um clique
// nesse intervalo é descartado em silêncio. `.hydrated()` espera o React anexar as props ao elemento (o que só
// acontece na hidratação) para que o clique seguinte valha. Uso: cy.getBySel('x').hydrated().click()
Cypress.Commands.add('hydrated', { prevSubject: true }, (subject) => {
  return cy.wrap(subject, { log: false }).should(($el) => {
    const hydrated = Object.keys($el[0]).some((key) => key.startsWith('__reactProps$'))
    expect(hydrated, 'elemento hidratado pelo React').to.equal(true)
  })
})
