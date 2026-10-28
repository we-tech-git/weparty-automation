import { feedCardPage } from '../../support/pages/FeedCardPage'
import { topEventsPage } from '../../support/pages/TopEventsPage'
import { FEED_EVENTS_REQUEST_TIMEOUT } from '../../support/constants/timeouts'

// Seção "Top eventos" do feed (`/feed?tab=top-events`). A lista consome
// GET /events/top e reaproveita o FeedCard — por isso as ações do card
// continuam em FeedCardPage.js. Todas as leituras são mockadas e a única
// escrita testada (curtir) é interceptada: nada é persistido na produção.
// Ver docs/dados-e-integracao.md.

const TOP_EVENTS_ROUTE = /\/events\/top(\?.*)?$/
const RECOMMENDATIONS_ROUTE = /\/events\/recommendations(\?.*)?$/

function mockTopEvents (fixture = 'api/events-trending') {
  cy.fixture(fixture).then((body) => {
    cy.intercept('GET', TOP_EVENTS_ROUTE, body).as('getTopEvents')
  })
}

function mockEmptyRecommendations () {
  cy.fixture('api/events-trending-empty').then((body) => {
    cy.intercept('GET', RECOMMENDATIONS_ROUTE, body).as('getPublicRecommendationsEmpty')
  })
}

function openTopEvents () {
  mockTopEvents()
  topEventsPage.visit()
  cy.wait('@getTopEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
  topEventsPage.assertLoaded()
}

describe('Top eventos', () => {
  let trending

  before(() => {
    cy.fixture('api/events-trending').then((fixture) => {
      trending = fixture.data.events
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()

    cy.mockFeedReads()
    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    // O feed inicial também carrega o painel de tendências (GET /events/top).
    // Consumir essa requisição aqui garante que os aliases criados em cada
    // teste pertençam somente à navegação para Top eventos.
    cy.wait('@getTrendingEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
  })

  it('CT-263-top-eventos-acessar: acessar /feed?tab=top-events carrega o ranking', () => {
    // Act
    openTopEvents()

    // Assert
    topEventsPage.assertBreadcrumb('Top eventos')
    topEventsPage.assertCardsCount(trending.length)
    feedCardPage.assertEventTitle(trending[0].name)
  })

  it('CT-264-top-eventos-navegacao-menu: o menu lateral leva para Top eventos e atualiza a URL', () => {
    // Arrange
    mockTopEvents()

    // Act
    topEventsPage.openFromSidebar()
    cy.wait('@getTopEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Assert
    topEventsPage.assertLoaded()
    topEventsPage.assertUrlTopEvents()
    topEventsPage.assertBreadcrumb('Top eventos')
  })

  it('CT-265-top-eventos-ranking: os cards mostram as posições #1 a #5 na ordem da API', () => {
    // Act
    openTopEvents()

    // Assert
    topEventsPage.assertCardsCount(trending.length)
    trending.forEach((event, index) => {
      topEventsPage.assertRank(index, index + 1)
      feedCardPage.assertEventTitle(event.name, index)
    })
  })

  it('CT-266-top-eventos-sem-abas: a seção Top eventos não exibe as abas do feed', () => {
    // Act
    openTopEvents()

    // Assert
    topEventsPage.assertTabsHidden()
  })

  it('CT-267-top-eventos-vazio: sem eventos em alta, mostra o estado vazio', () => {
    // Arrange
    mockTopEvents('api/events-trending-empty')
    mockEmptyRecommendations()

    // Act
    topEventsPage.visit()
    cy.wait('@getTopEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Assert
    topEventsPage.assertEmpty()
    topEventsPage.assertNoCards()
  })

  it('CT-268-top-eventos-erro: falha da API mantém a tela com estado vazio', () => {
    // Arrange
    cy.intercept('GET', TOP_EVENTS_ROUTE, {
      statusCode: 500,
      body: { success: false, message: 'Erro interno ao carregar eventos em alta' },
    }).as('getTopEventsError')

    // Act
    topEventsPage.visit()
    cy.wait('@getTopEventsError', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Assert
    topEventsPage.assertBreadcrumb('Top eventos')
    topEventsPage.assertEmpty()
    topEventsPage.assertNoCards()
  })

  it('CT-269-top-eventos-curtir: curtir um evento do ranking atualiza o coração e o contador', () => {
    // Arrange
    openTopEvents()
    cy.fixture('api/toggle-like-success').then((fixture) => {
      cy.intercept('POST', /\/events\/[^/]+\/likes(\?.*)?$/, fixture).as('toggleLikeTopEvent')
    })
    feedCardPage.assertNotLiked()
    feedCardPage.assertLikesCount(trending[0].likesCount)

    // Act
    feedCardPage.toggleLike()

    // Assert
    cy.wait('@toggleLikeTopEvent')
    feedCardPage.assertLiked()
    feedCardPage.assertLikesCount(trending[0].likesCount + 1)
  })

  it('CT-270-top-eventos-compartilhar: compartilhar um evento do ranking abre o diálogo com o título', () => {
    // Arrange
    openTopEvents()

    // Act
    feedCardPage.share()

    // Assert - compartilhar é client-side (useShareStore), sem chamada de API
    feedCardPage.assertShareSheetVisible(trending[0].name)
  })

  it('CT-271-top-eventos-voltar: Voltar retorna para a home do feed', () => {
    // Arrange
    openTopEvents()
    topEventsPage.assertBreadcrumb('Top eventos')

    // Act
    topEventsPage.clickBack()

    // Assert
    topEventsPage.assertBreadcrumbHidden()
    topEventsPage.assertTabsVisible()
    topEventsPage.assertUrlHome()
  })

  it('CT-272-top-eventos-mobile: o ranking permanece visível sem overflow horizontal', () => {
    // Arrange
    cy.viewport(375, 812)

    // Act
    openTopEvents()

    // Assert - retrato
    topEventsPage.assertRank(0, 1)
    topEventsPage.assertNoHorizontalOverflow()

    // Act - paisagem
    cy.viewport(812, 375)

    // Assert
    topEventsPage.assertRank(0, 1)
    topEventsPage.assertNoHorizontalOverflow()
  })
})
