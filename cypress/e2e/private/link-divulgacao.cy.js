import { eventDetailsPage } from '../../support/pages/EventDetailsPage'
import { loginPage } from '../../support/pages/LoginPage'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// Web-app: visitante que chega por link de divulgação (`/event/:id?ref=`) sem login vai para
// /login?next=... e volta ao evento com o ref preservado (WEPARTY-239). Com a flag do backend
// ligada, confere também a visita contada no banco (dia em America/Sao_Paulo).
const suite = Cypress.env('local') ? describe : describe.skip
const whenBackendOn = Cypress.env('featureTrackingLinks') ? it : it.skip

suite('Link de divulgação no web-app (ambiente local)', () => {
  const REF = 'webapp23'
  let eventId
  let email

  before(() => {
    cy.localOwnedEvent().then((evt) => {
      eventId = evt.eventId
      cy.dbQuery(`delete from "EventTrackingLink" where code='${REF}'`)
      cy.dbQuery(`insert into "EventTrackingLink" (id, "eventId", label, code) values (gen_random_uuid()::text, '${eventId}', 'Cypress web-app', '${REF}')`)
    })
    cy.localUserEmail('user', 3).then((e) => { email = e })
  })

  after(() => {
    cy.dbQuery(`delete from "EventTrackingLink" where code='${REF}'`)
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  const entrarPeloLink = () => {
    eventDetailsPage.visitWithRef(eventId, REF)
    loginPage.assertOnLoginWithNext(`/event/${eventId}?ref=${REF}`)
    loginPage.fillCredentials({ email, password: LOCAL_TEST_PASSWORD })
    loginPage.submit()
  }

  it('CT-290-webapp-ref-preservado-no-login: deslogado vai para /login?next= e volta ao evento com o ref', () => {
    // Arrange + Act
    entrarPeloLink()
    // Assert
    eventDetailsPage.assertUrlKeepsRef(eventId, REF)
  })

  whenBackendOn('CT-292-webapp-ref-conta-visita: a volta do login conta 1 visita para o link no dia de Brasília', () => {
    // Arrange
    const contagem = () =>
      cy.dbQuery(`select coalesce(sum(count),0) from "EventSourceDailyView" where code='${REF}' and day=(now() at time zone 'America/Sao_Paulo')::date`).then(Number)
    contagem().then((antes) => {
      // Act
      entrarPeloLink()
      eventDetailsPage.assertUrlKeepsRef(eventId, REF)
      // Assert (a tela pode buscar o evento mais de uma vez; o que importa é ter contado)
      contagem().should('be.greaterThan', antes)
    })
  })
})
