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

function mockToggleUnlikeSuccess () {
  cy.fixture('api/toggle-unlike-success').then(fixture => {
    cy.intercept('POST', /\/events\/[^/]+\/likes(\?.*)?$/, fixture).as('toggleUnlikeRequest')
  })
}

describe('Feed - FeedCard', () => {
  let feedEvent
  let secondEvent

  before(() => {
    cy.fixture('api/events-recommendations').then(fixture => {
      feedEvent = fixture.data.events[0]
      secondEvent = fixture.data.events[1]
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

  it('CT-013-feed-descurtir-evento: descurtir um evento que estava curtido restaura o estado inicial', () => {
    // Arrange — curtir
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)

    // Act — curtir
    feedCardPage.toggleLike()

    // Assert — curtido
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount + 1)

    // Arrange — preparar mock de descurtir
    mockToggleUnlikeSuccess()

    // Act — descurtir
    feedCardPage.toggleLike()

    // Assert — volta ao estado inicial
    cy.wait('@toggleUnlikeRequest')
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)
  })

  it('CT-014-feed-curtir-segundo-evento: curtir o segundo card do feed atualiza apenas o seu estado', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked(1)
    feedCardPage.assertLikesCount(secondEvent.likesCount, 1)

    // Act
    feedCardPage.toggleLike(1)

    // Assert
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked(1)
    feedCardPage.assertLikesCount(secondEvent.likesCount + 1, 1)
    feedCardPage.assertNotLiked(0)
  })

  it('CT-015-feed-fechar-comentarios: fechar o painel de comentários após abri-lo', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedCardPage.assertCommentsHidden()

    // Act — abrir
    feedCardPage.toggleComments()

    // Assert — visível
    feedCardPage.assertCommentsVisible()

    // Act — fechar
    feedCardPage.toggleComments()

    // Assert — oculto novamente
    feedCardPage.assertCommentsHidden()
  })

  it('CT-016-feed-curtir-dois-eventos: curtir dois eventos diferentes mantém o estado de cada um', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked(0)
    feedCardPage.assertNotLiked(1)

    // Act — curtir card 0
    feedCardPage.toggleLike(0)
    cy.wait('@toggleLikeRequest')

    // Act — curtir card 1
    feedCardPage.toggleLike(1)
    cy.wait('@toggleLikeRequest')

    // Assert — ambos curtidos
    feedCardPage.assertLiked(0)
    feedCardPage.assertLiked(1)
    feedCardPage.assertNotLiked(2)
  })

  it('CT-017-feed-verificar-todos-cards: feed carrega os 5 eventos mockados como cards', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Act & Assert
    feedPage.assertLoaded()
    feedPage.assertCardsCount(5)
  })

  it('CT-018-feed-verificar-dados-card: card exibe título, data, local e nome do organizador', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Act & Assert
    feedPage.assertLoaded()
    feedCardPage.assertEventTitle(feedEvent.name)
    feedCardPage.assertEventDate('2099')
    feedCardPage.assertEventLocation(feedEvent.location)
    feedCardPage.assertEventOrganizer(feedEvent.organizer.name)
  })

  it('CT-019-feed-curtir-sem-alterar-outros: curtir um card não altera o estado de outro', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    feedPage.assertLoaded()
    feedCardPage.assertNotLiked(0)
    feedCardPage.assertNotLiked(1)

    // Act
    feedCardPage.toggleLike(0)

    // Assert
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked(0)
    feedCardPage.assertNotLiked(1)
    feedCardPage.assertNotLiked(2)
  })

  it('CT-020-feed-compartilhar-segundo: compartilhar o segundo evento exibe o nome correto no diálogo', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()

    // Act
    feedCardPage.share(1)

    // Assert
    feedCardPage.assertShareSheetVisible(secondEvent.name)
  })

  it('CT-021-feed-estado-like-apos-comentarios: estado de like persiste após abrir e fechar comentários', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedCardPage.assertCommentsHidden()

    // Act — curtir
    feedCardPage.toggleLike()
    cy.wait('@toggleLikeRequest')

    // Assert — curtido
    feedCardPage.assertLiked()

    // Act — abrir e fechar comentários
    feedCardPage.toggleComments()
    feedCardPage.assertCommentsVisible()
    feedCardPage.toggleComments()
    feedCardPage.assertCommentsHidden()

    // Assert — like persiste
    feedCardPage.assertLiked()
  })

  it('CT-022-feed-estado-inicial-card: verificar estado inicial do card antes de qualquer interação', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Act & Assert
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)
    feedCardPage.assertCommentsHidden()
    feedCardPage.assertEventTitle(feedEvent.name)
  })
})