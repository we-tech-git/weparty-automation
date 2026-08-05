describe('Login', () => {
  beforeEach(() => {
    cy.visit('/public/Login');
  });

  it('Deve carregar a página de login', () => {
    cy.url().should('include', '/public/Login');
  });

  it('Deve exibir os campos de email e senha', () => {
    cy.get('input[type="email"], input[name="email"], input[id="email"]').should('be.visible');
    cy.get('input[type="password"], input[name="password"], input[id="password"]').should('be.visible');
  });

  it('Deve exibir o botão de submit/login', () => {
    cy.get('button[type="submit"], button:contains("Entrar"), button:contains("Login"), button:contains("Sign in")').should('be.visible');
  });

  it('Deve fazer login com credenciais válidas', () => {
    cy.fixture('credentials').then((creds) => {
      cy.get('input[type="email"], input[name="email"], input[id="email"]').type(creds.email);
      cy.get('input[type="password"], input[name="password"], input[id="password"]').type(creds.password);
      cy.get('button[type="submit"], button:contains("Entrar"), button:contains("Login"), button:contains("Sign in")').click();

      cy.url({ timeout: 15000 }).should('not.include', '/public/Login');
    });
  });
});
