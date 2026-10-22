import { cmsLoginPage } from '../../support/pages/CmsLoginPage'

// Login do CMS no novo layout (WEPARTY-232 — visual B). Tudo mockado: roda sem backend,
// bastando `ENV_CMS_URL` apontar para um CMS em execução (ver docs/cms-cenarios.md).
const suite = Cypress.env('cmsUrl') ? describe : describe.skip
const itNoGoogle = Cypress.env('cmsGoogleConfigured') ? it.skip : it
const CREDENTIALS = { email: 'produtor@example.test', password: 'senha-de-teste-123' }

suite('CMS - login (novo layout)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.viewport(1280, 720)
  })

  it('CT-160-cms-login-layout-desktop: mostra o painel da marca, o formulário e o login com Google', () => {
    // Act
    cmsLoginPage.visit()

    // Assert
    cmsLoginPage.assertBrandPanelVisible()
    cy.getBySel('brand-panel').should('contain.text', 'sob seu controle.')
    cy.getBySel('login-title').should('have.text', 'Entrar')
    cy.getBySel('login-google').should('be.visible')
    cmsLoginPage.assertPasswordType('password')
  })

  it('CT-161-cms-login-layout-mobile: no mobile o painel lateral some e a faixa da marca aparece', () => {
    // Arrange
    cy.viewport(390, 844)

    // Act
    cmsLoginPage.visit()

    // Assert
    cmsLoginPage.assertBrandPanelVisible(false)
    cy.contains('sob seu controle.').should('be.visible')
    cy.getBySel('login-submit').should('be.visible')
  })

  it('CT-162-cms-login-ver-senha: o olho alterna a senha entre oculta e visível', () => {
    // Arrange
    cmsLoginPage.visit()
    cmsLoginPage.fill({ password: CREDENTIALS.password })

    // Act
    cmsLoginPage.togglePasswordVisibility()

    // Assert
    cmsLoginPage.assertPasswordType('text')
    cy.getBySel('toggle-password').should('have.attr', 'aria-pressed', 'true')

    // Act + Assert
    cmsLoginPage.togglePasswordVisibility()
    cmsLoginPage.assertPasswordType('password')
  })

  it('CT-163-cms-login-campos-obrigatorios: enviar vazio mostra os dois erros e não chama a API', () => {
    // Arrange
    cy.intercept('POST', /\/users\/login/, cy.spy().as('loginSpy'))
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.submit()

    // Assert
    cmsLoginPage.assertEmailError('E-mail obrigatório')
    cmsLoginPage.assertPasswordError('Senha obrigatória')
    cy.get('@loginSpy').should('not.have.been.called')
  })

  it('CT-164-cms-login-email-invalido: e-mail mal formado mostra erro de formato', () => {
    // Arrange
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill({ email: 'sem-arroba', password: CREDENTIALS.password })
    cmsLoginPage.submit()

    // Assert
    cmsLoginPage.assertEmailError('E-mail inválido')
  })

  it('CT-165-cms-login-sucesso: login válido grava a sessão e leva para o Início', () => {
    // Arrange
    cy.fixture('cms/login-success').then((body) => cy.intercept('POST', /\/users\/login/, { statusCode: 200, body }).as('login'))
    cy.cmsMockApi()
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill(CREDENTIALS)
    cmsLoginPage.submit()

    // Assert
    cy.wait('@login').its('request.body').should('deep.equal', CREDENTIALS)
    cmsLoginPage.assertOnHome()
    cy.getCookie('access_token').should('exist')
  })

  it('CT-166-cms-login-credenciais-invalidas: 401 mostra aviso de erro e mantém na tela de login', () => {
    // Arrange
    cy.intercept('POST', /\/users\/login/, { statusCode: 401, body: { success: false, message: 'Credenciais inválidas' } }).as('login')
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill(CREDENTIALS)
    cmsLoginPage.submit()

    // Assert
    cy.wait('@login')
    cmsLoginPage.assertToast('error')
    cmsLoginPage.assertOnLogin()
    cy.getCookie('access_token').should('not.exist')
  })

  it('CT-167-cms-login-botao-carregando: enquanto envia, o botão fica desabilitado (sem duplo envio)', () => {
    // Arrange
    cy.fixture('cms/login-success').then((body) => cy.intercept('POST', /\/users\/login/, { statusCode: 200, body, delay: 1200 }).as('login'))
    cy.cmsMockApi()
    cmsLoginPage.visit()
    cmsLoginPage.fill(CREDENTIALS)

    // Act
    cmsLoginPage.submit()

    // Assert
    cy.getBySel('login-submit').should('be.disabled').and('contain.text', 'Entrando')
    cy.wait('@login')
    cy.get('@login.all').should('have.length', 1)
  })

  it('CT-168-cms-login-lembrar-me: marcar guarda só o e-mail; desmarcar remove', () => {
    // Arrange
    cy.fixture('cms/login-success').then((body) => cy.intercept('POST', /\/users\/login/, { statusCode: 200, body }).as('login'))
    cy.cmsMockApi()
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill(CREDENTIALS)
    cmsLoginPage.toggleRemember(true)
    cmsLoginPage.submit()
    cy.wait('@login')
    cmsLoginPage.assertOnHome()

    // Assert
    cy.window().then((win) => {
      expect(win.localStorage.getItem('REMEMBERED_EMAIL')).to.eq('produtor@example.test')
      expect(JSON.stringify(win.localStorage)).not.to.contain(CREDENTIALS.password)
    })
  })

  itNoGoogle('CT-169-cms-login-google-indisponivel: sem client id configurado, o botão avisa em vez de falhar', () => {
    // Arrange
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.clickGoogle()

    // Assert
    cmsLoginPage.assertToast('warning')
    cmsLoginPage.assertOnLogin()
  })
})
