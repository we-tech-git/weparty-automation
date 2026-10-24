import { ROUTES } from '../constants/routes'

// Page Object do perfil do próprio usuário (`/profile`) e dos elementos de layout que o cercam
// (header, rodapé, menu fixo de baixo) no viewport de celular. Cobre as correções da versão mobile
// (WEPARTY-125 a 131). Ver docs/dados-e-integracao.md.
export const MOBILE_VIEWPORT = { width: 390, height: 844 }
const MIN_TAB_FONT_PX = 14

class ProfileMobilePage {
  visit () {
    cy.visit(ROUTES.PROFILE)
    cy.getBySel('profile-followers-button').should('be.visible')
  }

  // ── Header (WEPARTY-131): logo, busca e avatar numa única linha ──
  assertHeaderInSingleRow () {
    cy.getBySel('app-header-brand').then(($brand) => {
      cy.getBySel('app-header-search').then(($search) => {
        cy.getBySel('app-header-user').then(($user) => {
          const brand = $brand[0].getBoundingClientRect()
          const search = $search[0].getBoundingClientRect()
          const user = $user[0].getBoundingClientRect()
          // mesma faixa vertical: o centro da busca cai dentro da altura do logo
          expect(search.top + search.height / 2, 'centro da busca na linha do logo').to.be.within(brand.top, brand.bottom)
          expect(search.top + search.height / 2, 'centro da busca na linha do avatar').to.be.within(user.top, user.bottom)
          // ordem horizontal: logo, busca, avatar
          expect(search.left, 'busca depois do logo').to.be.at.least(brand.right - 1)
          expect(user.left, 'avatar depois da busca').to.be.at.least(search.right - 1)
        })
      })
    })
  }

  // ── Seguidores/seguindo (WEPARTY-126): parecem botão e são clicáveis ──
  assertFollowStatsLookClickable () {
    ;['profile-followers-button', 'profile-following-button'].forEach((id) => {
      cy.getBySel(id).should('match', 'button').then(($el) => {
        const style = getComputedStyle($el[0])
        expect(style.cursor, `${id} cursor`).to.equal('pointer')
        expect(Number.parseFloat(style.borderTopWidth), `${id} borda`).to.be.greaterThan(0)
        expect(style.backgroundColor, `${id} fundo`).not.to.equal('rgba(0, 0, 0, 0)')
      })
    })
  }

  // ── Abas curtidos/confirmados/preferências (WEPARTY-127): fonte legível ──
  assertTabsReadable () {
    ;['profile-tab-liked', 'profile-tab-confirmed', 'profile-tab-settings'].forEach((id) => {
      cy.getBySel(id).then(($el) => {
        expect(Number.parseFloat(getComputedStyle($el[0]).fontSize), `${id} fonte`).to.be.at.least(MIN_TAB_FONT_PX)
      })
    })
  }

  openConfirmedTab () {
    cy.getBySel('profile-tab-confirmed').click()
  }

  // ── Cards de confirmados (WEPARTY-128 e 129): sem "Cancelar" e sem contador no card ──
  confirmedCards () {
    return cy.getBySel('event-mini-card')
  }

  assertConfirmedCardsReadOnly () {
    this.confirmedCards().should('have.length.at.least', 1).each(($card) => {
      expect($card.find('button').length, 'botões dentro do card').to.equal(0)
      expect($card.text(), 'texto do card').not.to.match(/cancelar|confirmados/i)
      // o card cabe na largura da tela (layout não estoura)
      expect($card[0].getBoundingClientRect().right, 'borda direita do card').to.be.at.most(MOBILE_VIEWPORT.width)
    })
  }

  // ── Rodapé (WEPARTY-130): a última linha não fica sob o menu fixo ──
  scrollToBottom () {
    cy.scrollTo('bottom', { duration: 400 })
  }

  assertFooterClearOfBottomNav () {
    cy.getBySel('app-footer-bottom').should('be.visible').then(($footerBottom) => {
      cy.getBySel('feed-sidebar-nav').then(($nav) => {
        const footerBottom = $footerBottom[0].getBoundingClientRect()
        const nav = $nav[0].getBoundingClientRect()
        expect(footerBottom.bottom, 'fim do rodapé acima do menu').to.be.at.most(nav.top + 1)
      })
    })
  }
}

export const profileMobilePage = new ProfileMobilePage()
