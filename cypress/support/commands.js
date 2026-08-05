Cypress.Commands.add('login', (email, password) => {
  cy.visit('/public/Login');
  cy.get('input[type="email"], input[name="email"], input[id="email"]').type(email);
  cy.get('input[type="password"], input[name="password"], input[id="password"]').type(password);
  cy.get('button[type="submit"], button:contains("Entrar"), button:contains("Login")').click();
});
