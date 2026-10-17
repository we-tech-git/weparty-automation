import { LOCAL_TEST_PASSWORD } from '../support/constants/local';

// Dados do cadastro NÃO ficam em fixture versionada (o repositório é público). A senha vem de
// CYPRESS_signupPassword; sem ela, usa a senha de teste do ambiente local (dump anonimizado).
describe('Cadastro', () => {
  beforeEach(() => {
    cy.visit('/signup');
  });

  it('Deve carregar a pagina de cadastro', () => {
    // Assert
    cy.url().should('include', '/signup');
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
    cy.wrap({ name: 'Test User WeParty', password: Cypress.env('signupPassword') || LOCAL_TEST_PASSWORD }).then((signup) => {

      cy.task('getNextEmail').then(({ email, emailUser }) => {
        cy.get('#fullName').type(signup.name);
        cy.get('#email').type(email);
        cy.get('#password').type(signup.password);
        cy.get('#confirmPassword').type(signup.password);
        cy.get('.terms-checkbox').check({ force: true });

        // Act
        cy.get('button[type="submit"]').click();

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/confirm-email');

        // Act - buscar PIN de verificacao no inbox sharklasers
        cy.getVerificationPin(emailUser);

        // Act - preencher PIN e confirmar
        cy.visit('/confirm-email');
        // Ambiente local: abrir a página reenvia o código (o anterior deixa de valer) — lê o PIN mais novo.
        if (Cypress.env('local')) cy.getVerificationPin(emailUser, { minMessages: 2 });
        cy.then(() => {
          const pin = Cypress.env('VERIFICATION_PIN');
          cy.get('.pin-input').each(($input, index) => {
            if (index < pin.length) {
              cy.wrap($input).type(pin[index]);
            }
          });
        });

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/interest');

        // Act - pular interesses
        cy.contains('Pular esta etapa por enquanto').click();

        // Assert
        cy.url({ timeout: 10000 }).should('include', '/add-friends');

        // Act - pular amigos
        cy.contains('Pular esta etapa por enquanto').click();

        // Assert
        cy.url({ timeout: 10000 }).should('include', '/congratulations');

        // Act - continuar para o feed
        cy.get('button.continue-btn').click();

        // Assert
        cy.url({ timeout: 15000 }).should('include', '/feed');
      });
    });
  });
});