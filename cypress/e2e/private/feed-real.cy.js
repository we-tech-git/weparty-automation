import { feedCardPage } from '../../support/pages/FeedCardPage'
import { feedPage } from '../../support/pages/FeedPage'
import { loginPage } from '../../support/pages/LoginPage'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// Feed SEM mocks, contra o ambiente local (backend + banco com o dump anonimizado).
// Complementa feed.cy.js (que mocka tudo para rodar em produção).
const suite = Cypress.env('local') ? describe : describe.skip

suite('Feed - fluxo real (ambiente local)', () => {
  let email

  before(() => {
    cy.localUserEmail('user', 2).then((e) => { email = e })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
  })

  const entrarNoFeed = () => {
    loginPage.visit()
    loginPage.fillCredentials({ email, password: LOCAL_TEST_PASSWORD })
    loginPage.submit()
    loginPage.assertRedirectedToFeed()
    feedPage.assertLoaded()
  }

  it('CT-140-feed-real-login-e-lista: login real leva ao feed com eventos do dump', () => {
    // Act
    entrarNoFeed()

    // Assert
    cy.getBySel('feed-card').should('have.length.at.least', 1)
  })

  it('CT-141-feed-real-curtir-persiste: curtir um card muda o estado e persiste no banco', () => {
    // Arrange
    const curtidas = () =>
      cy.dbQuery(`select count(*) from "EventLike" l join "User" u on u.id=l."userId" where u.email='${email}'`).then(Number)
    entrarNoFeed()

    curtidas().then((antes) => {
      // Act
      feedCardPage.toggleLike()

      // Assert
      curtidas().should((depois) => {
        expect(Math.abs(depois - antes), 'uma curtida a mais ou a menos').to.eq(1)
      })

      // Act (volta ao estado original)
      feedCardPage.toggleLike()
      curtidas().should('eq', antes)
    })
  })
})
