import { signupPage } from '../support/pages/SignupPage'
import { ROUTES } from '../support/constants/routes'

describe('Cadastro', () => {
  beforeEach(() => {
    signupPage.visit()
  })

  it('Deve carregar a pagina de cadastro', () => {
    // Assert
    signupPage.assertLoaded()
  })

  it('Deve exibir o formulario de cadastro com todos os campos', () => {
    // Assert
    signupPage.assertFormVisible()
  })

  it('Deve realizar cadastro completo com sucesso', () => {
    // Arrange
    cy.fixture('credentials').then((creds) => {
      const signup = creds.signup

      cy.task('getNextEmail').then(({ email, emailUser }) => {
        signupPage.fillForm({ ...signup, email })

        // Act
        signupPage.submit()

        // Assert
        signupPage.assertOn(ROUTES.CONFIRM_EMAIL)
        signupPage.assertPinInputsVisible()

        // Act - buscar PIN de verificacao no inbox sharklasers. Nao visitar
        // /confirm-email de novo: o mount da pagina reenvia o codigo e
        // invalida o PIN que acabou de ser lido.
        cy.getVerificationPin(emailUser).then((pin) => {
          signupPage.fillVerificationPin(pin)
        })

        // Assert
        signupPage.assertOn(ROUTES.INTEREST)

        // Act - pular interesses
        signupPage.skipCurrentStep()

        // Assert
        signupPage.assertOn(ROUTES.ADD_FRIENDS)

        // Act - pular amigos
        signupPage.skipCurrentStep()

        // Assert
        signupPage.assertOn(ROUTES.CONGRATULATIONS)

        // Act - continuar para o feed
        signupPage.continueToFeed()

        // Assert
        signupPage.assertOn(ROUTES.FEED)
      })
    })
  })
})
