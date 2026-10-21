import { interestPage } from '../../support/pages/InterestPage'
import { loginPage } from '../../support/pages/LoginPage'
import { ROUTES } from '../../support/constants/routes'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// Página de um interesse, contra o ambiente local (precisa de um usuário do dump que já tenha
// interesses no perfil). Cobre os cenários WEPARTY-181 (botão do interesse leva à página dele)
// e 182 (scroll na página do interesse).
const suite = Cypress.env('local') ? describe : describe.skip

suite('Página de interesse (ambiente local)', () => {
  let email
  let nomeDoInteresse

  before(() => {
    // Usuário verificado, não bloqueado, com ao menos um interesse aprovado no perfil.
    cy.dbQuery(
      `select u.email || '|' || i.name from "User" u join "UserInterest" ui on ui."userId"=u.id join "Interest" i on i.id=ui."interestId"
       where not coalesce(u."isBlocked",false) and u."emailVerificationStatus"='verified' and i.status='APPROVED'
       order by u."createdAt", i.name limit 1`,
    ).then((linha) => {
      expect(linha, 'usuário do dump com interesse').to.contain('|')
      ;[email, nomeDoInteresse] = linha.split('|')
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
    loginPage.visit()
    loginPage.fillCredentials({ email, password: LOCAL_TEST_PASSWORD })
    loginPage.submit()
    loginPage.assertRedirectedToFeed()
    cy.visit(ROUTES.PROFILE)
    cy.getBySel('profile-interest-tag').should('have.length.at.least', 1)
  })

  it('CT-220-interesse-botao-abre-pagina: clicar no interesse do perfil leva à página daquele interesse', () => {
    // Act
    interestPage.openFromProfile(nomeDoInteresse)

    // Assert
    interestPage.assertOpened(nomeDoInteresse)
  })

  it('CT-221-interesse-scroll: a página do interesse responde ao scroll do mouse', () => {
    // Arrange
    interestPage.openFromProfile(nomeDoInteresse)
    interestPage.assertOpened(nomeDoInteresse)

    // Act
    interestPage.scrollToBottom()

    // Assert
    interestPage.assertScrolledDown()
  })
})
