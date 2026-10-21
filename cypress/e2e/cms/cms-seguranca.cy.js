import { cmsLoginPage } from '../../support/pages/CmsLoginPage'
import { cmsNewEventPage } from '../../support/pages/CmsNewEventPage'
import { cmsShellPage } from '../../support/pages/CmsShellPage'
import { CMS_ROUTES } from '../../support/constants/routes'

// Segurança do CMS (WEPARTY-232): sessão, guard de rota, cabeçalhos, XSS, upload e vazamento de dados.
// Cada teste aponta o item do checklist de segurança do AGENTS.md que cobre. API mockada.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip
const CMS = () => Cypress.env('cmsUrl')

suite('CMS - segurança', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
    cy.viewport(1280, 900)
  })

  it('CT-190-cms-seg-sem-vazamento-no-storage: campos internos da resposta de login não são persistidos (exposição excessiva de dados)', () => {
    // Arrange
    cy.fixture('cms/login-success').then((body) => cy.intercept('POST', /\/users\/login/, { statusCode: 200, body }).as('login'))
    cy.cmsMockApi()
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill({ email: 'produtor@example.test', password: 'senha-de-teste-123' })
    cmsLoginPage.submit()
    cy.wait('@login')
    cmsLoginPage.assertOnHome()

    // Assert
    cy.window().then((win) => {
      const dump = JSON.stringify(win.localStorage)
      ;['SEGREDO-API-KEY', 'SEGREDO-RESET', 'SEGREDO-GOOGLE'].forEach((segredo) => {
        expect(dump, `storage contém ${segredo}`).not.to.contain(segredo)
      })
    })
  })

  it('CT-191-cms-seg-token-fora-da-url: o token e a senha nunca aparecem em URL ou query string (dado sensível em query string)', () => {
    // Arrange
    const urls = []
    cy.intercept({ url: /.*/ }, (req) => { urls.push(req.url) })
    cy.fixture('cms/login-success').then((body) => cy.intercept('POST', /\/users\/login/, { statusCode: 200, body }).as('login'))
    cy.cmsMockApi()
    cmsLoginPage.visit()

    // Act
    cmsLoginPage.fill({ email: 'produtor@example.test', password: 'senha-de-teste-123' })
    cmsLoginPage.submit()
    cy.wait('@login')
    cmsLoginPage.assertOnHome()

    // Assert
    cy.then(() => {
      urls.forEach((u) => {
        expect(u).not.to.match(/senha-de-teste-123|cms-mock\.assinatura|password=|token=/)
      })
    })
    cy.url().should('not.match', /token=|password=/)
  })

  it('CT-192-cms-seg-guard-sem-sessao: rotas do CMS redirecionam para o login sem cookie (autorização/falha fechada)', () => {
    ;[CMS_ROUTES.HOME, CMS_ROUTES.MY_EVENTS, CMS_ROUTES.NEW_EVENT, CMS_ROUTES.ADMIN_USERS].forEach((rota) => {
      // Act
      cy.visit(`${CMS()}${rota}`)

      // Assert
      cy.url().should('include', CMS_ROUTES.LOGIN)
    })
  })

  it('CT-193-cms-seg-login-logado-redireciona: quem já tem sessão não vê o login e vai para o Início', () => {
    // Arrange
    cy.cmsMockApi()

    // Act
    cy.cmsVisitLogged(CMS_ROUTES.LOGIN)

    // Assert
    cy.url({ timeout: 20000 }).should('include', CMS_ROUTES.HOME)
  })

  it('CT-194-cms-seg-cabecalhos: respostas têm cabeçalhos de segurança e não expõem X-Powered-By', () => {
    // Act
    cy.request(`${CMS()}${CMS_ROUTES.LOGIN}`).then((res) => {
      // Assert
      expect(res.headers['x-frame-options']).to.eq('DENY')
      expect(res.headers['x-content-type-options']).to.eq('nosniff')
      expect(res.headers['referrer-policy']).to.eq('strict-origin-when-cross-origin')
      expect(res.headers['permissions-policy']).to.contain('camera=()')
      expect(res.headers).not.to.have.property('x-powered-by')
    })
  })

  it('CT-195-cms-seg-logout-limpa-sessao: sair remove token do storage e o cookie, e volta ao login (token em storage)', () => {
    // Arrange
    cy.cmsMockApi()
    cy.cmsVisitLogged(CMS_ROUTES.HOME)
    cy.getBySel('producer-home').should('be.visible')

    // Act
    cmsShellPage.logout()

    // Assert
    cy.url({ timeout: 20000 }).should('include', CMS_ROUTES.LOGIN)
    cy.getCookie('access_token').should('not.exist')
    cy.window().then((win) => {
      expect(win.localStorage.getItem('ACCESS_TOKEN')).to.be.null
      expect(win.localStorage.getItem('LOGGED_USER')).to.be.null
    })
  })

  it('CT-196-cms-seg-401-derruba-sessao: resposta 401 da API limpa a sessão e volta ao login (sessão expirada)', () => {
    // Arrange
    cy.intercept('GET', /\/events\/my-dashboard/, { statusCode: 401, body: { message: 'Unauthorized' } })
    cy.intercept('GET', /\/events\/my-events/, { statusCode: 401, body: { message: 'Unauthorized' } })

    // Act
    cy.cmsVisitLogged(CMS_ROUTES.HOME)

    // Assert
    cy.url({ timeout: 20000 }).should('include', CMS_ROUTES.LOGIN)
    cy.getCookie('access_token').should('not.exist')
  })

  it('CT-197-cms-seg-xss-titulo-de-evento: título com HTML é exibido como texto, sem executar script (XSS)', () => {
    // Arrange
    const payload = '<img src=x onerror="window.__xss=1">Festa'
    cy.fixture('cms/my-events').then((body) => {
      body.events[0].title = payload
      cy.intercept('GET', /\/events\/my-events/, { statusCode: 200, body })
    })
    cy.fixture('cms/dashboard').then((body) => cy.intercept('GET', /\/events\/my-dashboard/, { statusCode: 200, body }))

    // Act
    cy.cmsVisitLogged(CMS_ROUTES.MY_EVENTS)
    cy.getBySel('event-card').should('have.length.at.least', 1)

    // Assert
    cy.getBySel('event-title').first().should('contain.text', '<img src=x')
    cy.get('img[src="x"]').should('not.exist')
    cy.window().its('__xss').should('be.undefined')
  })

  it('CT-198-cms-seg-upload-svg-rejeitado: a capa não aceita SVG (upload de SVG executa script)', () => {
    // Arrange
    cmsNewEventPage.visitLogged()

    // Act
    cmsNewEventPage.uploadCover({
      contents: Cypress.Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
      fileName: 'capa.svg',
      mimeType: 'image/svg+xml',
    })

    // Assert
    cmsNewEventPage.assertCoverRejected()
    cmsNewEventPage.assertCoverThumbnails(0)
  })

  it('CT-199-cms-seg-upload-grande-rejeitado: imagem acima de 5 MB é rejeitada (limite de tamanho)', () => {
    // Arrange
    cmsNewEventPage.visitLogged()

    // Act
    cmsNewEventPage.uploadCover({
      contents: Cypress.Buffer.alloc(5 * 1024 * 1024 + 1, 1),
      fileName: 'capa-grande.png',
      mimeType: 'image/png',
    })

    // Assert
    cmsNewEventPage.assertCoverRejected()
    cmsNewEventPage.assertCoverThumbnails(0)
  })

  it('CT-200-cms-seg-links-externos: todo link com target=_blank tem rel noopener noreferrer (tabnabbing)', () => {
    // Arrange
    cy.cmsMockApi()
    cy.cmsVisitLogged(CMS_ROUTES.HOME)
    cy.getBySel('producer-home').should('be.visible')

    // Assert - vale para qualquer link que abra em nova aba (zero links também é aceitável)
    cy.document().then((doc) => {
      doc.querySelectorAll('a[target="_blank"]').forEach((a) => {
        expect(a.getAttribute('rel') || '', a.href).to.match(/noopener/).and.to.match(/noreferrer/)
      })
    })
  })
})
