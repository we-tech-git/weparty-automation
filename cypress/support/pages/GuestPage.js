import { ROUTES } from '../constants/routes'

// Navegação do visitante (sem login) pelas telas públicas e o bloqueio das ações
// que exigem conta. O diálogo "Acesso Restrito" (LoginRequiredDialog.vue) não tem
// data-testid: usa o texto visível (3º nível da prioridade de seletores).
// Ver docs/dados-e-integracao.md.
class GuestPage {
  // Visita a rota e confirma que o visitante continuou nela (nenhum redirecionamento).
  visitPublic (route) {
    cy.visit(route)
    cy.location('pathname').should('eq', route)
  }

  // Nenhuma URL do app pode carregar os prefixos antigos /public e /private (WEPARTY-168).
  assertCleanUrl () {
    cy.location('pathname').should('not.match', /\/(public|private)(\/|$)/)
  }

  // Idem para os links (href) renderizados na tela atual.
  assertLinksWithoutLegacyPrefix () {
    cy.get('a[href]').each(($a) => {
      expect($a.attr('href'), `href de "${$a.text().trim().slice(0, 30)}"`).not.to.match(/\/(public|private)(\/|$)/)
    })
  }

  visitPrivateRoute (route) {
    cy.visit(route)
  }

  assertRedirectedToLogin () {
    cy.location('pathname').should('eq', ROUTES.LOGIN)
  }

  // Ação que exige login numa tela pública: curtir o primeiro evento da explore.
  likeFirstEventAsGuest () {
    cy.getBySel('feed-card-like').first().click()
  }

  assertLoginRequiredDialog () {
    cy.contains('Acesso Restrito').should('be.visible')
    cy.contains('é necessário ter uma conta na We Party').should('be.visible')
  }

  chooseAlreadyHaveAccount () {
    cy.contains('button', 'Já tenho conta').click()
  }
}

export const guestPage = new GuestPage()
