import { ROUTES } from '../constants/routes'
import { PROFILE_VISIBLE_TIMEOUT } from '../constants/timeouts'

// Page Object da página de perfil do usuário logado (`/profile`).
// Sempre que o componente expõe `data-testid` usamos `cy.getBySel`; nos pontos
// em que a produção ainda não expõe (nome, bio, modais e formulário), caímos
// para ARIA/texto visível ou `id` semântico — nunca classe de estilo.
// Ver docs/arquitetura-e-organizacao.md e docs/dados-e-integracao.md.
class ProfilePage {
  visit () {
    cy.visit(ROUTES.PROFILE)
  }

  assertLoaded () {
    cy.getBySel('profile-tab-liked', { timeout: PROFILE_VISIBLE_TIMEOUT }).should('be.visible')
  }

  waitProfileRequest () {
    cy.wait('@getProfile', { timeout: PROFILE_VISIBLE_TIMEOUT })
  }

  // ── Dados do cabeçalho ──
  assertHeaderName (name) {
    cy.contains('h1', name).should('be.visible')
  }

  assertProfileData ({ name, username, bio, joined }) {
    this.assertHeaderName(name)
    cy.contains('span', `@${username}`).should('be.visible')
    cy.contains('p', bio).should('be.visible')
    cy.contains('span', /Entrou em/).should('contain.text', joined)
  }

  assertFollowStats ({ followers, following }) {
    cy.getBySel('profile-followers-button').should('contain.text', String(followers))
    cy.getBySel('profile-following-button').should('contain.text', String(following))
  }

  assertInterests (names) {
    names.forEach(name => {
      cy.getBySel('profile-interest-tag').should('contain.text', name)
    })
  }

  // ── Abas ──
  clickTab (tabId) {
    cy.getBySel(`profile-tab-${tabId}`).click()
  }

  assertTabSelected (tabId) {
    cy.getBySel(`profile-tab-${tabId}`).should('have.attr', 'aria-selected', 'true')
  }

  assertTabInUrl (tabId) {
    cy.location('search').should('include', `tab=${tabId}`)
  }

  // ── Eventos curtidos / confirmados ──
  assertEventCard (title) {
    cy.contains('[data-testid="event-mini-card"]', title).should('be.visible')
  }

  assertNoEventCards () {
    cy.getBySel('event-mini-card').should('not.exist')
  }

  assertLikedEmpty () {
    cy.contains('Nenhum evento curtido').should('be.visible')
  }

  assertConfirmedEmpty () {
    cy.contains('Nenhuma presença confirmada').should('be.visible')
  }

  // ── Preferências ──
  assertSettingsVisible () {
    cy.contains('Notificações').should('be.visible')
    cy.contains('Idioma').should('be.visible')
    cy.contains('Sair da conta').should('be.visible')
    cy.getBySel('profile-settings-show-liked-events').should('be.visible')
    cy.getBySel('profile-settings-show-confirmed-events').should('be.visible')
  }

  // ── Modal de seguidores / seguindo ──
  followModal (title) {
    return cy.contains('h2', title).parent().parent()
  }

  openFollowersModal () {
    cy.getBySel('profile-followers-button').click()
  }

  openFollowingModal () {
    cy.getBySel('profile-following-button').click()
  }

  assertFollowModalTitle (title) {
    cy.contains('h2', title).should('be.visible')
  }

  assertFollowListItem (title, name) {
    this.followModal(title).contains('li', name).should('be.visible')
  }

  assertFollowButtonText (title, userId, text) {
    this.followModal(title).find(`[data-testid="follow-modal-toggle-${userId}"]`).should('contain.text', text)
  }

  toggleFollowInModal (title, userId) {
    this.followModal(title).find(`[data-testid="follow-modal-toggle-${userId}"]`).click()
  }

  // ── Edição de perfil ──
  openEditModal () {
    cy.contains('button', 'Editar Perfil').click()
  }

  editModal () {
    return cy.contains('h2', 'Editar Perfil').parent().parent()
  }

  assertEditModalOpen () {
    cy.contains('h2', 'Editar Perfil').should('be.visible')
  }

  assertEditModalClosed () {
    cy.contains('h2', 'Editar Perfil').should('not.exist')
  }

  assertEditForm ({ name, username, bio }) {
    cy.get('#edit-name').should('have.value', name)
    cy.get('#edit-username').should('have.value', username)
    cy.get('#edit-bio').should('have.value', bio)
  }

  fillEditForm ({ name, bio }) {
    if (name !== undefined) cy.get('#edit-name').clear().type(name)
    if (bio !== undefined) cy.get('#edit-bio').clear().type(bio)
  }

  saveEdit () {
    this.editModal().contains('button', 'Salvar').click()
  }

  // ── Recomendações ──
  recommendationsCard () {
    return cy.contains('h3', 'Quem seguir').parent().parent()
  }

  // A lista tem scroll próprio (max-height), então quem está abaixo do corte
  // existe no DOM mas não está "visible" para o Cypress.
  assertRecommendation (name) {
    this.recommendationsCard().contains('li', name).should('exist')
  }

  assertRecommendationVisible (name) {
    this.recommendationsCard().contains('li', name).should('be.visible')
  }

  assertNoRecommendation (name) {
    this.recommendationsCard().contains('li', name).should('not.exist')
  }

  searchRecommendation (term) {
    this.recommendationsCard().find('input').clear().type(term)
  }

  waitSearchResults () {
    cy.wait('@searchUsers')
  }

  // ── Compartilhar perfil ──
  shareProfile () {
    cy.getBySel('profile-share').click()
  }

  assertShareSheetVisible (title) {
    cy.contains('Compartilhar Evento').should('be.visible')
      .parent('header')
      .next()
      .should('be.visible')
      .and('contain.text', title)
  }

  closeShareSheet () {
    cy.get('body').type('{esc}')
  }

  assertShareSheetHidden () {
    cy.contains('Compartilhar Evento').should('not.exist')
  }

  // ── Feedback ──
  assertSnackbar (message) {
    cy.contains(message).should('be.visible')
  }

  // ── Responsividade ──
  assertNoHorizontalOverflow () {
    cy.document().then((doc) => {
      const root = doc.documentElement
      expect(root.scrollWidth, 'sem overflow horizontal').to.be.at.most(root.clientWidth + 1)
    })
  }
}

export const profilePage = new ProfilePage()
