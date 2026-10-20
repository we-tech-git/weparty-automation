import { feedCardPage } from '../../support/pages/FeedCardPage'
import { feedPage } from '../../support/pages/FeedPage'
import { FEED_EVENTS_REQUEST_TIMEOUT } from '../../support/constants/timeouts'

// Mocks de LEITURA do feed (e de comentários) vêm de `cy.mockFeedReads()` —
// sem eles, as chamadas reais responderiam 401 e o `callApi` deslogaria o
// usuário antes das interações. Ver docs/dados-e-integracao.md.

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

function mockToggleLikeError () {
  cy.fixture('api/toggle-like-error').then(fixture => {
    cy.intercept('POST', /\/events\/[^/]+\/likes(\?.*)?$/, { statusCode: 500, body: fixture }).as('toggleLikeError')
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

    cy.mockFeedReads()
  })

  // -----------------------------------------------------------------------
  // 1. RENDERIZAÇÃO E VERIFICAÇÃO DE DADOS DOS CARDS
  // -----------------------------------------------------------------------

  it('CT-017-feed-verificar-todos-cards: feed carrega os 5 eventos mockados como cards', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Act & Assert
    feedPage.assertLoaded()
    feedPage.assertCardsCount(5)
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

  it('CT-025-feed-contadores-card: card exibe os contadores de comentários e interesses do evento', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()

    // Act & Assert
    feedCardPage.assertCommentsLabelVisible()
    feedCardPage.assertEventInterestsLabelVisible()
  })

  // -----------------------------------------------------------------------
  // 2. INTERAÇÕES DE CURTIR / DESCURTIR
  // -----------------------------------------------------------------------

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

    // Act
    feedCardPage.toggleLike(1)

    // Assert — o mock de toggle devolve likesCount fixo, então validamos
    // apenas isLiked e isolamento; o contador exato depende do mock
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked(1)
    feedCardPage.assertNotLiked(0)
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

  it('CT-024-feed-dois-cliques-rapidos-like: dois cliques rápidos no like não causam estado inconsistente', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)

    // Act — dois cliques rápidos (ambos disparam "curtir" porque a resposta
    // do primeiro ainda não foi processada quando o segundo acontece)
    feedCardPage.toggleLike()
    feedCardPage.toggleLike()

    // Assert — estado final deve ser consistente (curtido, pois ambos os
    // requests retornaram sucesso e isLiked:true)
    cy.wait('@toggleLikeRequest')
    cy.wait('@toggleLikeRequest')
    feedCardPage.assertLiked()
  })

  it('CT-026-feed-falha-ao-curtir: erro da API ao curtir mantém o estado original do card', () => {
    // Arrange
    mockToggleLikeError()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)

    // Act
    feedCardPage.toggleLike()

    // Assert — mesmo com erro 500, o card não deve mudar de estado
    cy.wait('@toggleLikeError')
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount)
  })

  // -----------------------------------------------------------------------
  // 3. INTERAÇÕES DE COMENTÁRIOS
  // -----------------------------------------------------------------------

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

  it('CT-027-feed-isolamento-comentarios: abrir e fechar comentários funciona independentemente para cada card', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Card 0 — abrir e fechar (já validado em CT-011/CT-015)
    feedCardPage.toggleComments(0)
    feedCardPage.assertCommentsVisible()
    feedCardPage.toggleComments(0)
    feedCardPage.assertCommentsHidden()

    // Card 1 — toggle independente deve abrir o painel
    feedCardPage.toggleComments(1)
    cy.wait(1000)
    feedCardPage.assertCommentsAnyPanelVisible()
  })

  it('CT-029-feed-alternar-painel-comentarios: alternar o toggle entre cards alterna o painel de comentários', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    cy.wait('@getEventComments', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Act — abrir card 0
    feedCardPage.toggleComments(0)
    feedCardPage.assertCommentsVisible()

    // Act — alternar para card 1 (o painel compartilhado troca de card)
    feedCardPage.toggleComments(1)
    cy.wait(1000)
    feedCardPage.assertCommentsAnyPanelVisible()
  })

  // -----------------------------------------------------------------------
  // 4. INTERAÇÕES DE COMPARTILHAMENTO
  // -----------------------------------------------------------------------

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

  it('CT-023-feed-fechar-dialogo-share: fechar o diálogo de compartilhamento com Escape', () => {
    // Arrange
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()

    // Act — abrir
    feedCardPage.share()
    feedCardPage.assertShareSheetVisible(feedEvent.name)

    // Act — fechar
    feedCardPage.closeShareSheet()

    // Assert
    feedCardPage.assertShareSheetHidden()
  })

  // -----------------------------------------------------------------------
  // 5. INTERAÇÕES COMBINADAS E PERSISTÊNCIA DE ESTADO
  // -----------------------------------------------------------------------

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

  it('CT-028-feed-curtir-e-compartilhar: curtir um evento e depois compartilhá-lo mantém ambos os estados', () => {
    // Arrange
    mockToggleLikeSuccess()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    feedPage.assertLoaded()
    feedCardPage.assertNotLiked()

    // Act — curtir
    feedCardPage.toggleLike()
    cy.wait('@toggleLikeRequest')

    // Assert — curtido
    feedCardPage.assertLiked()
    feedCardPage.assertLikesCount(feedEvent.likesCount + 1)

    // Act — compartilhar
    feedCardPage.share()

    // Assert — compartilhamento aberto com estado de like mantido
    feedCardPage.assertShareSheetVisible(feedEvent.name)
    feedCardPage.assertLiked()
  })
})