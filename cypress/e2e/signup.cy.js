describe('Cadastro', () => {
  beforeEach(() => {
    cy.visit('/public/Signup');
  });

  it('Deve carregar a pagina de cadastro', () => {
    // Assert
    cy.url().should('include', '/public/Signup');
  });

  it('Deve exibir o formulario de cadastro com todos os campos', () => {
    // Assert
    cy.get('#fullName').should('be.visible');
    cy.get('#email').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('#confirmPassword').should('be.visible');
    cy.get('.terms-checkbox').should('exist');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('Deve realizar cadastro completo com sucesso', () => {
    // Arrange
    cy.fixture('credentials').then((creds) => {
      const signup = creds.signup;

      cy.task('getNextEmail').then(({ email, emailUser }) => {
        cy.get('#fullName').type(signup.name);
        cy.get('#email').type(email);
        cy.get('#password').type(signup.password);
        cy.get('#confirmPassword').type(signup.password);
        cy.get('.terms-checkbox').check({ force: true });

        // Act
        cy.get('button[type="submit"]').click();

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/public/ConfirmEmail');

        // Act - buscar PIN de verificacao no inbox sharklasers
        cy.getVerificationPin(emailUser);

        // Act - preencher PIN e confirmar
        cy.visit('/public/ConfirmEmail');
        cy.then(() => {
          const pin = Cypress.env('VERIFICATION_PIN');
          cy.get('.pin-input').each(($input, index) => {
            if (index < pin.length) {
              cy.wrap($input).type(pin[index]);
            }
          });
        });

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/public/Interest');

        // Act - pular interesses
        cy.contains('Pular esta etapa por enquanto').click();

        // Assert
        cy.url({ timeout: 10000 }).should('include', '/public/AddFriends');

        // Act - pular amigos
        cy.contains('Pular esta etapa por enquanto').click();

        // Assert
        cy.url({ timeout: 10000 }).should('include', '/public/Congratulations');

        // Act - continuar para o feed
        cy.get('button.continue-btn').click();

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/private/feed');
      });
    });
  });
});