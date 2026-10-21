import { ROUTES } from '../constants/routes'
import { FEED_CARD_VISIBLE_TIMEOUT } from '../constants/timeouts'

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
    // Há telas sem nenhum link (só botões): nesse caso não há o que conferir.
    cy.get('body').then(($body) => {
      $body.find('a[href]').each((_, a) => {
        expect(a.getAttribute('href'), `href de "${a.textContent.trim().slice(0, 30)}"`).not.to.match(/\/(public|private)(\/|$)/)
      })
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
    // A explore só renderiza os cards depois de esperar a geolocalização (timeout interno de 10s).
    cy.getBySel('feed-card-like', { timeout: FEED_CARD_VISIBLE_TIMEOUT }).first().click()
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
