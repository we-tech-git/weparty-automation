import { eventDetailsPage } from '../../support/pages/EventDetailsPage'
import { FEED_EVENTS_REQUEST_TIMEOUT } from '../../support/constants/timeouts'

const EVENT_ID = 'evt-e2e-001'

describe('Detalhes do evento', () => {
  let feedEvent

  before(() => {
    cy.fixture('api/events-recommendations').then((fixture) => {
      feedEvent = fixture.data.events[0]
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()

    // LEITURAS do feed e da pagina de detalhes: a suite roda contra producao
    // com token mockado, entao qualquer chamada real responderia 401 e o
    // callApi deslogaria o usuario antes das interacoes.
    cy.mockFeedReads()
    mockEventDetailsReads()

    cy.login()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })

    // Arrange
    eventDetailsPage.visit(EVENT_ID)
    cy.wait('@getEventDetails', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
    eventDetailsPage.assertLoaded(feedEvent.name)
  })

  it('CT-030-detalhes-eu-vou: confirmar presenca atualiza o botao para confirmado', () => {
    // Arrange
    cy.fixture('api/attendance-success').then((fixture) => {
      cy.intercept('PUT', /\/events\/evt-e2e-001\/attendance(\?.*)?$/, fixture).as('confirmAttendance')
    })
    eventDetailsPage.assertEuVouVisible()

    // Act
    eventDetailsPage.clickEuVou()

    // Assert
    cy.wait('@confirmAttendance')
    eventDetailsPage.assertConfirmed()
  })

  it('CT-031-detalhes-favoritar: favoritar o evento atualiza o botao para favoritado', () => {
    // Arrange
    cy.fixture('api/toggle-favorite-success').then((fixture) => {
      cy.intercept('POST', /\/events\/evt-e2e-001\/favorite(\?.*)?$/, fixture).as('toggleFavorite')
    })

    // Act
    eventDetailsPage.clickFavorite()

    // Assert
    cy.wait('@toggleFavorite')
    eventDetailsPage.assertFavorited()
  })

  it('CT-032-detalhes-compartilhar: compartilhar abre o dialogo com o nome do evento', () => {
    // Act
    eventDetailsPage.clickShare()

    // Assert - compartilhar e client-side (useShareStore), sem chamada de API
    eventDetailsPage.assertShareSheetVisible(feedEvent.name)
  })
})

function mockEventDetailsReads () {
  cy.fixture('api/events-recommendations').then((fixture) => {
    const event = fixture.data.events[0]
    cy.intercept('GET', /\/events\/evt-e2e-001(\?.*)?$/, {
      statusCode: 200,
      body: { event },
    }).as('getEventDetails')
  })
  cy.fixture('api/events-favorites-empty').then((fixture) => {
    cy.intercept('GET', /\/events\/favorites(\?.*)?$/, fixture).as('getFavoriteEvents')
  })
  cy.fixture('api/my-attendance-not-going').then((fixture) => {
    cy.intercept('GET', /\/events\/evt-e2e-001\/my-attendance(\?.*)?$/, fixture).as('getMyAttendance')
  })
  cy.fixture('api/follow-status-not-following').then((fixture) => {
    cy.intercept('GET', /\/follow(\/|\?|$)/, fixture).as('getFollowStatus')
  })
}
