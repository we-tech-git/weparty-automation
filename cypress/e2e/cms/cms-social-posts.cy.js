import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// CMS: fila de aprovação de social posts (/cms/admin/social-posts) contra o ambiente local.
// Os posts são criados pela API de integração (como o squad faz); o CMS é o que o admin usa para revisar.
const suite = Cypress.env('local') && Cypress.env('cmsUrl') && Cypress.env('socialKey') ? describe : describe.skip

suite('CMS - Social posts (fila de aprovação e publicados)', () => {
  const key = () => ({ 'x-api-key': Cypress.env('socialKey') })
  const legenda = `CMS social ${Date.now()}`

  const entrar = () => {
    cy.localUserEmail('admin').then((email) => {
      cy.visit(`${Cypress.env('cmsUrl')}/login`)
      cy.get('input[type="email"], input[name="email"]', { timeout: 30000 }).type(email)
      cy.get('input[type="password"]').type(LOCAL_TEST_PASSWORD)
      cy.get('button[type="submit"]').click()
      cy.url({ timeout: 30000 }).should('not.include', '/login')
    })
  }

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('CT-180-cms-social-fila-e-xtext: o post pendente aparece na fila e a prévia mostra "Texto para o X"', () => {
    // Arrange
    cy.apiRequest('POST', '/social-posts', {
      headers: key(),
      body: { format: 'FEED_CAROUSEL', caption: legenda, xText: 'Texto do X do teste', hashtags: ['weparty'], mediaUrls: ['https://example.com/a.png'], eventTitle: 'Evento X' },
    }).its('status').should('eq', 201)
    entrar()

    // Act
    cy.visit(`${Cypress.env('cmsUrl')}/cms/admin/social-posts`)

    // Assert
    cy.contains(legenda, { timeout: 30000 }).should('be.visible').click()
    cy.contains('Texto para o X', { timeout: 15000 }).should('be.visible')
    cy.contains('Texto do X do teste').should('be.visible')
  })

  it('CT-181-cms-social-publicados: depois de publicado, o post aparece na aba Publicados com "ver post"', () => {
    // Arrange
    const pub = `CMS publicado ${Date.now()}`
    cy.apiLogin('admin').then((admin) => {
      cy.apiRequest('POST', '/social-posts', {
        headers: key(),
        body: { format: 'FEED_CAROUSEL', caption: pub, xText: 'x', hashtags: [], mediaUrls: ['https://example.com/b.png'] },
      }).then((c) => {
        const id = c.body.id
        cy.apiRequest('POST', `/admin/social-posts/${id}/approve`, { token: admin.token }).its('status').should('be.oneOf', [200, 201])
        cy.apiRequest('POST', `/social-posts/${id}/publication`, { headers: key(), body: { platform: 'INSTAGRAM', externalId: 'ig-cms', url: 'https://instagram.com/p/ig-cms', finalize: true } }).its('status').should('be.oneOf', [200, 201])
      })
    })
    entrar()

    // Act
    cy.visit(`${Cypress.env('cmsUrl')}/cms/admin/social-posts`)
    cy.contains('button', 'Publicados', { timeout: 30000 }).click()

    // Assert
    cy.contains(pub, { timeout: 30000 }).should('be.visible').click()
    cy.contains('ver post', { timeout: 15000 }).should('have.attr', 'href').and('include', 'instagram.com/p/ig-cms')
  })
})
