import { feedCardPage } from '../../support/pages/FeedCardPage'
import { feedPage } from '../../support/pages/FeedPage'
import { FEED_EVENTS_REQUEST_TIMEOUT } from '../../support/constants/timeouts'

// DEPENDÊNCIA DE AMBIENTE: os 4 `data-testid` do FeedCard
// (feed-card/-like/-comments-toggle/-share) foram adicionados no
// we-party-web-app junto da consolidação do componente único, mas na data
// de escrita deste spec essa mudança ainda não tinha PR mergeado/deploy em
// produção (confirmado inspecionando o bundle publicado em
// https://www.wepartyapp.com: a classe CSS `.feed-card` existe, o atributo
// `data-testid` não). Como a suíte roda contra produção
// (cypress.config.js), este spec fica VERMELHO até esse deploy acontecer —
// não é falha de asserção/seletor/mock. Reexecutar após o deploy.

// Mocks de LEITURA disparados ao montar o feed autenticado (Feed.vue) e o
// card (FeedCard.vue → InlineComments.vue). Não alteram estado, mas ainda
// assim precisam ser mockados aqui: a suíte roda contra produção
// (cypress.config.js) com um token de login também mockado, então qualquer
// uma dessas chamadas reais responderia 401 — e `callApi` (we-party-web-app
// src/api/index.ts) desloga o usuário e redireciona pra fora do feed a
// qualquer 401 com token presente, o que quebraria o teste antes de ele
// conseguir interagir com o card. Ver docs/dados-e-integracao.md.
function mockFeedReads () {
  cy.fixture('api/events-recommendations').then(fixture => {
    cy.intercept('GET', /\/events\/recommendations(\?.*)?$/, fixture).as('getFeedEvents')
  })
  cy.fixture('api/event-comments-empty').then(fixture => {
    cy.intercept('GET', /\/events\/[^/]+\/comments(\?.*)?$/, fixture).as('getEventComments')
  })
  cy.fixture('api/user-interests-empty').then(fixture => {
    cy.intercept('GET', /\/users\/interests(\?.*)?$/, fixture).as('getUserInterests')
  })
  cy.fixture('api/events-likes-empty').then(fixture => {
    cy.intercept('GET', /\/events\/likes(\?.*)?$/, fixture).as('getLikedEvents')
  })
  cy.fixture('api/events-trending-empty').then(fixture => {
    cy.intercept('GET', /\/events\/top(\?.*)?$/, fixture).as('getTrendingEvents')
  })
}

// Curtir é uma chamada que ALTERA estado (POST) — mock obrigatório pela
// regra 5 do AGENTS.md, independente do 401 acima.
function mockToggleLikeSuccess () {
  cy.fixture('api/toggle-like-success').then(fixture => {
    cy.intercept('POST', /\/events\/[^/]+\/likes(\?.*)?$/, fixture).as('toggleLikeRequest')
  })
}

describe('Feed - FeedCard', () => {
  let feedEvent

  before(() => {
    cy.fixture('api/events-recommendations').then(fixture => {
      feedEvent = fixture.data.events[0]
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()

    mockFeedReads()
  })

  it('CT-010-feed-curtir-evento: curtir um evento do feed atualiza o coração e o contador', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)

    // Act
    feedCardPage.toggleLike()

    // Assert
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount + 1)
  })

  it('CT-011-feed-ver-comentarios: abrir os comentários do card exibe a área de comentários inline', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    // Aguarda a busca automática de contagem que InlineComments dispara ao
    // montar (antes de qualquer clique) — ver InlineComments.vue onMounted.
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedCardPage.assertCommentsHidden()

    // Act
    feedCardPage.toggleComments()

    // Assert
    feedCardPage.assertCommentsVisible()
  })

  it('CT-012-feed-compartilhar-evento: compartilhar um evento abre o menu de compartilhamento', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()

    // Act
    feedCardPage.share()

    // Assert — compartilhar é só client-side (useShareStore), sem chamada de API.
    feedCardPage.assertShareSheetVisible(feedEvent.name)
  })
})
