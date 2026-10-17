// API de social-posts: ingestão do squad (chave de integração) e fila de aprovação do admin. Só no ambiente local
// (escreve no banco anonimizado). Cobre o guard, a validação, aprovar/rejeitar, claim/release e o registro de publicação.
const suite = Cypress.env('local') ? describe : describe.skip

suite('API - Social posts (chave de integração + admin)', () => {
  const key = () => ({ 'x-api-key': Cypress.env('socialKey') })
  const novo = (extra = {}) => ({
    format: 'FEED_CAROUSEL',
    caption: `Legenda de teste ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    xText: 'Texto próprio para o X',
    hashtags: ['weparty'],
    mediaUrls: ['https://example.com/slide-1.png'],
    eventTitle: 'Evento de teste',
    squadRunId: 'cypress',
    ...extra,
  })
  let admin
  before(() => { cy.apiLogin('admin').then((a) => { admin = a }) })

  const criar = (extra) => cy.apiRequest('POST', '/social-posts', { headers: key(), body: novo(extra) }).then((r) => {
    expect(r.status, 'criação').to.eq(201)
    return r.body
  })
  const aprovar = (id) => cy.apiRequest('POST', `/admin/social-posts/${id}/approve`, { token: admin.token }).then((r) => {
    expect(r.status, 'aprovar').to.be.oneOf([200, 201])
    expect(r.body.status).to.eq('APPROVED')
  })

  it('CT-170-social-guard: sem chave ou com chave errada as rotas da integração recusam (401)', () => {
    ;[['POST', '/social-posts'], ['GET', '/social-posts/approved'], ['POST', '/social-posts/00000000-0000-0000-0000-000000000000/claim']].forEach(([m, p]) => {
      cy.apiRequest(m, p, { body: m === 'POST' ? novo() : undefined }).its('status').should('eq', 401)
      cy.apiRequest(m, p, { headers: { 'x-api-key': 'chave-errada' }, body: m === 'POST' ? novo() : undefined }).its('status').should('eq', 401)
    })
  })

  it('CT-171-social-criar-e-validar: cria PENDING_APPROVAL com xText e recusa corpo inválido', () => {
    criar().then((p) => {
      expect(p.status).to.eq('PENDING_APPROVAL')
      expect(p.xText).to.eq('Texto próprio para o X')
    })
    cy.apiRequest('POST', '/social-posts', { headers: key(), body: novo({ mediaUrls: [] }) }).its('status').should('eq', 400)
    cy.apiRequest('POST', '/social-posts', { headers: key(), body: { ...novo(), format: 'INVALIDO' } }).its('status').should('eq', 400)
  })

  it('CT-172-social-admin-guard: a fila do admin exige login de admin (401 sem token, 403 para usuário comum)', () => {
    cy.apiRequest('GET', '/admin/social-posts').its('status').should('eq', 401)
    cy.apiLogin('user').then((u) => {
      cy.apiRequest('GET', '/admin/social-posts', { token: u.token }).its('status').should('eq', 403)
    })
    cy.apiRequest('GET', '/admin/social-posts', { token: admin.token }).its('status').should('eq', 200)
  })

  it('CT-173-social-aprovar-e-listar-aprovados: só aprovado aparece em /approved', () => {
    criar().then((p) => {
      cy.apiRequest('GET', '/social-posts/approved', { headers: key() }).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.map((x) => x.id), 'pendente fora da lista').to.not.include(p.id)
      })
      aprovar(p.id)
      cy.apiRequest('GET', '/social-posts/approved', { headers: key() }).then((r) => {
        expect(r.body.map((x) => x.id), 'aprovado na lista').to.include(p.id)
      })
    })
  })

  it('CT-174-social-rejeitar: rejeitar exige motivo e guarda o motivo', () => {
    criar().then((p) => {
      cy.apiRequest('POST', `/admin/social-posts/${p.id}/reject`, { token: admin.token, body: {} }).its('status').should('eq', 400)
      cy.apiRequest('POST', `/admin/social-posts/${p.id}/reject`, { token: admin.token, body: { reason: 'fora do tom' } }).then((r) => {
        expect(r.status).to.be.oneOf([200, 201])
        expect(r.body.status).to.eq('REJECTED')
        expect(r.body.rejectionReason).to.eq('fora do tom')
      })
    })
  })

  it('CT-175-social-claim-release: claim duplo dá 409; release libera para outro claim', () => {
    criar().then((p) => {
      aprovar(p.id)
      cy.apiRequest('POST', `/social-posts/${p.id}/claim`, { headers: key() }).its('status').should('eq', 201)
      cy.apiRequest('POST', `/social-posts/${p.id}/claim`, { headers: key() }).its('status').should('eq', 409)
      cy.apiRequest('GET', '/social-posts/approved', { headers: key() }).then((r) => {
        expect(r.body.map((x) => x.id), 'travado some da lista').to.not.include(p.id)
      })
      cy.apiRequest('POST', `/social-posts/${p.id}/release`, { headers: key() }).its('status').should('eq', 201)
      cy.apiRequest('POST', `/social-posts/${p.id}/claim`, { headers: key() }).its('status').should('eq', 201)
    })
  })

  it('CT-176-social-claim-nao-aprovado: não dá para travar um post que não está aprovado', () => {
    criar().then((p) => {
      cy.apiRequest('POST', `/social-posts/${p.id}/claim`, { headers: key() }).its('status').should('eq', 409)
    })
  })

  it('CT-177-social-publicacao: registra por plataforma e só finaliza com finalize=true', () => {
    criar().then((p) => {
      aprovar(p.id)
      cy.apiRequest('POST', `/social-posts/${p.id}/claim`, { headers: key() }).its('status').should('eq', 201)
      cy.apiRequest('POST', `/social-posts/${p.id}/publication`, { headers: key(), body: { platform: 'INSTAGRAM', externalId: 'ig-1', url: 'https://instagram.com/p/ig-1' } }).then((r) => {
        expect(r.status).to.be.oneOf([200, 201])
        expect(r.body.publications.INSTAGRAM.externalId).to.eq('ig-1')
        expect(r.body.status, 'ainda não finalizou').to.not.eq('PUBLISHED')
      })
      cy.apiRequest('POST', `/social-posts/${p.id}/publication`, { headers: key(), body: { platform: 'X', externalId: 'x-1', url: 'https://x.com/i/status/x-1', finalize: true } }).then((r) => {
        expect(r.status).to.be.oneOf([200, 201])
        expect(r.body.status).to.eq('PUBLISHED')
        expect(r.body.publishedAt, 'publishedAt').to.be.a('string')
        expect(Object.keys(r.body.publications)).to.have.members(['INSTAGRAM', 'X'])
      })
      cy.apiRequest('GET', '/social-posts/approved', { headers: key() }).then((r) => {
        expect(r.body.map((x) => x.id), 'publicado sai da lista').to.not.include(p.id)
      })
      cy.apiRequest('GET', '/admin/social-posts', { token: admin.token, qs: { status: 'PUBLISHED' } }).then((r) => {
        expect(r.status).to.eq(200)
        expect(r.body.map((x) => x.id)).to.include(p.id)
      })
    })
  })

  it('CT-178-social-publicacao-validacao: plataforma inválida e URL inválida são recusadas', () => {
    criar().then((p) => {
      aprovar(p.id)
      cy.apiRequest('POST', `/social-posts/${p.id}/publication`, { headers: key(), body: { platform: 'TIKTOK', externalId: '1' } }).its('status').should('eq', 400)
      cy.apiRequest('POST', `/social-posts/${p.id}/publication`, { headers: key(), body: { platform: 'X', externalId: '1', url: 'nao-e-url' } }).its('status').should('eq', 400)
    })
  })
})
