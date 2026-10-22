import { eventDetailsPage } from '../../support/pages/EventDetailsPage'
import { FEED_EVENTS_REQUEST_TIMEOUT } from '../../support/constants/timeouts'

const EVENT_ID = 'evt-e2e-001'
const LONG_DESCRIPTION_SNIPPET = 'O Baile de Teste E2E é o evento fixo'
const FAQ_QUESTION = 'Qual o horário de abertura?'
const FAQ_ANSWER = 'O evento abre às 22h.'

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

  it('CT-033-detalhes-dados-iniciais: detalhes exibem organizador, data, descricao e contadores', () => {
    // Act & Assert
    eventDetailsPage.assertInfoPanelVisible()
    eventDetailsPage.assertOrganizer('Anfitriã Teste')
    eventDetailsPage.assertEventDate('2099')
    eventDetailsPage.assertDescriptionSnippet(LONG_DESCRIPTION_SNIPPET)
    eventDetailsPage.assertAttendeesLabel()
    eventDetailsPage.assertConfirmedLabel()
  })

  it('CT-034-detalhes-abas: navegar entre Informacoes, Atracoes, Local e Comentarios', () => {
    // Arrange
    eventDetailsPage.assertInfoPanelVisible()

    // Act - Atracoes
    eventDetailsPage.openLineupTab()

    // Assert
    eventDetailsPage.assertLineupPanelVisible()
    eventDetailsPage.assertLineupItem('DJ Teste')
    eventDetailsPage.assertLineupItem('Banda Teste')

    // Act - Local
    eventDetailsPage.openLocationTab()

    // Assert
    eventDetailsPage.assertLocationPanelVisible()
    eventDetailsPage.assertMapVisible()

    // Act - Comentarios
    eventDetailsPage.openCommentsTab()

    // Assert
    eventDetailsPage.assertCommentsPanelVisible()

    // Act - volta para Informacoes
    eventDetailsPage.openInfoTab()

    // Assert
    eventDetailsPage.assertInfoPanelVisible()
  })

  it('CT-035-detalhes-curtir: curtir o evento incrementa o contador de curtidas', () => {
    // Arrange
    cy.fixture('api/toggle-like-success').then((fixture) => {
      cy.intercept('POST', /\/events\/evt-e2e-001\/likes(\?.*)?$/, fixture).as('toggleLikeDetails')
    })
    eventDetailsPage.assertLikeCount(5)

    // Act
    eventDetailsPage.clickLike()

    // Assert
    cy.wait('@toggleLikeDetails')
    eventDetailsPage.assertLikeCount(6)
  })

  it('CT-036-detalhes-descurtir: descurtir o evento restaura o contador inicial', () => {
    // Arrange - curtir primeiro
    cy.fixture('api/toggle-like-success').then((fixture) => {
      cy.intercept('POST', /\/events\/evt-e2e-001\/likes(\?.*)?$/, fixture).as('toggleLikeDetails')
    })
    eventDetailsPage.assertLikeCount(5)
    eventDetailsPage.clickLike()
    cy.wait('@toggleLikeDetails')
    eventDetailsPage.assertLikeCount(6)

    // Arrange - mock de descurtir
    cy.fixture('api/toggle-unlike-success').then((fixture) => {
      cy.intercept('POST', /\/events\/evt-e2e-001\/likes(\?.*)?$/, fixture).as('toggleUnlikeDetails')
    })

    // Act
    eventDetailsPage.clickLike()

    // Assert
    cy.wait('@toggleUnlikeDetails')
    eventDetailsPage.assertLikeCount(5)
  })

  it('CT-037-detalhes-seguir-organizador: seguir o organizador atualiza o botao para seguindo', () => {
    // Arrange
    eventDetailsPage.assertNotFollowing()
    cy.fixture('api/follow-success').then((fixture) => {
      cy.intercept('POST', /\/follow(\?.*)?$/, fixture).as('followOrganizer')
    })

    // Act
    eventDetailsPage.clickFollow()

    // Assert
    cy.wait('@followOrganizer')
    eventDetailsPage.assertFollowing()
  })

  it('CT-038-detalhes-ler-mais: expandir e recolher a descricao completa do evento', () => {
    // Arrange
    eventDetailsPage.assertReadMoreVisible()

    // Act - expandir
    eventDetailsPage.clickReadMore()

    // Assert
    eventDetailsPage.assertReadLessVisible()

    // Act - recolher
    eventDetailsPage.clickReadLess()

    // Assert
    eventDetailsPage.assertReadMoreVisible()
  })

  it('CT-039-detalhes-faq: expandir e recolher a resposta de uma pergunta frequente', () => {
    // Arrange
    eventDetailsPage.assertFaqSectionVisible()
    eventDetailsPage.openFaqList()

    // Act - abrir resposta
    eventDetailsPage.toggleFaq(FAQ_QUESTION)

    // Assert
    eventDetailsPage.assertFaqAnswerVisible(FAQ_ANSWER)

    // Act - fechar resposta
    eventDetailsPage.toggleFaq(FAQ_QUESTION)

    // Assert
    eventDetailsPage.assertFaqAnswerHidden(FAQ_ANSWER)
  })

  it('CT-040-detalhes-como-chegar: botao de rota abre o Google Maps em nova aba', () => {
    // Arrange
    eventDetailsPage.openLocationTab()
    eventDetailsPage.assertLocationPanelVisible()
    cy.window().then((win) => {
      cy.stub(win, 'open').returns(null).as('openMap')
    })

    // Act
    eventDetailsPage.clickHowToGetThere()

    // Assert
    cy.get('@openMap').should((stub) => {
      expect(stub).to.have.been.calledOnce
      expect(stub.firstCall.args[0]).to.contain('google.com/maps')
    })
  })

  it('CT-041-detalhes-mobile-barra-inferior: confirmar presenca pela barra fixa no mobile', () => {
    // Arrange
    cy.viewport(375, 812)
    eventDetailsPage.assertMobileBarVisible()
    cy.fixture('api/attendance-success').then((fixture) => {
      cy.intercept('PUT', /\/events\/evt-e2e-001\/attendance(\?.*)?$/, fixture).as('confirmAttendanceMobile')
    })

    // Act
    eventDetailsPage.clickMobileRsvp()

    // Assert
    cy.wait('@confirmAttendanceMobile')
    eventDetailsPage.assertMobileConfirmed()
  })

  it('CT-042-detalhes-erro-carregamento: falha da API exibe estado de erro com retry', () => {
    // Arrange
    cy.intercept('GET', /\/events\/evt-e2e-001(\?.*)?$/, {
      statusCode: 500,
      body: { success: false, message: 'Erro interno ao carregar o evento' },
    }).as('getEventDetailsError')

    // Act
    eventDetailsPage.visit(EVENT_ID)

    // Assert
    cy.wait('@getEventDetailsError')
    eventDetailsPage.assertErrorState()
  })

  it('CT-043-detalhes-retry-carregamento: tentar novamente recarrega os detalhes do evento', () => {
    // Arrange - forca o erro e entra no estado de falha
    cy.intercept('GET', /\/events\/evt-e2e-001(\?.*)?$/, {
      statusCode: 500,
      body: { success: false, message: 'Erro interno ao carregar o evento' },
    }).as('getEventDetailsError')
    eventDetailsPage.visit(EVENT_ID)
    cy.wait('@getEventDetailsError')
    eventDetailsPage.assertErrorState()

    // Arrange - proxima tentativa responde com sucesso
    cy.fixture('api/event-details').then((fixture) => {
      cy.intercept('GET', /\/events\/evt-e2e-001(\?.*)?$/, fixture).as('getEventDetailsRetry')
    })

    // Act
    cy.contains('button', 'Tentar novamente').click()

    // Assert
    cy.wait('@getEventDetailsRetry')
    eventDetailsPage.assertLoaded(feedEvent.name)
  })
})

function mockEventDetailsReads () {
  cy.fixture('api/event-details').then((fixture) => {
    cy.intercept('GET', /\/events\/evt-e2e-001(\?.*)?$/, fixture).as('getEventDetails')
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
