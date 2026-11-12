import { cmsEditEventPage } from '../../support/pages/CmsEditEventPage'
import { LOCAL_TEST_PASSWORD } from '../../support/constants/local'

// CMS: seção "Links de divulgação" na edição do evento (WEPARTY-239).
// Layout, estados e ações rodam com a API mockada (cy.intercept). A seção só existe com
// NEXT_PUBLIC_FF_TRACKING_LINKS=true no CMS; desligada, roda só o cenário "seção some".
// O fluxo real (CT-291) também exige FEATURE_TRACKING_LINKS no backend e grava no banco local.
const suite = Cypress.env('cmsUrl') ? describe : describe.skip
const cmsFlagOn = Cypress.env('ffTrackingLinks')
const whenOn = cmsFlagOn ? it : it.skip
const whenOff = cmsFlagOn ? it.skip : it
const whenRealFlow = cmsFlagOn && Cypress.env('featureTrackingLinks') && Cypress.env('local') ? it : it.skip

const EVENT_ID = 'evt-1'

suite('CMS - Links de divulgação (WEPARTY-239)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  whenOn('CT-283-cms-tracking-layout: lista rótulo, URL com ?ref= e total de cada link (desktop e mobile)', () => {
    ;[[1280, 800], [390, 844]].forEach((viewport) => {
      // Arrange + Act
      cmsEditEventPage.visitMocked(EVENT_ID, { viewport })
      cy.wait('@trackingLinks')
      // Assert
      cmsEditEventPage.section().scrollIntoView().should('be.visible')
      cmsEditEventPage.items().should('have.length', 2)
      cmsEditEventPage.assertItem('Instagram', { views: 7, urlIncludes: `/event/${EVENT_ID}?ref=abcd2345` })
      cmsEditEventPage.assertItem('WhatsApp', { views: 0, urlIncludes: `/event/${EVENT_ID}?ref=wxyz6789` })
      cy.getBySel('tracking-links-create').should('be.disabled')
    })
  })

  whenOn('CT-284-cms-tracking-criar: criar envia o rótulo, mostra aviso e recarrega a lista', () => {
    // Arrange
    cmsEditEventPage.visitMocked(EVENT_ID)
    cy.wait('@trackingLinks')
    cy.intercept('POST', new RegExp(`/events/${EVENT_ID}/tracking-links$`), {
      statusCode: 201,
      body: { id: 'link-3', label: 'Bio', code: 'bbbb2222', createdAt: '2026-11-10T12:00:00.000Z', totalViews: 0 },
    }).as('createLink')
    // Act
    cmsEditEventPage.createLink('  Bio  ')
    // Assert
    cy.wait('@createLink').its('request.body').should('deep.eq', { label: 'Bio' })
    cmsEditEventPage.assertToast('success', 'Link criado')
    cy.wait('@trackingLinks')
    cy.getBySel('tracking-links-label-input').should('have.value', '')
  })

  whenOn('CT-285-cms-tracking-copiar: copiar coloca a URL completa na área de transferência e avisa', () => {
    // Arrange
    cmsEditEventPage.visitMocked(EVENT_ID)
    cy.wait('@trackingLinks')
    cmsEditEventPage.stubClipboard()
    // Act
    cmsEditEventPage.copy('Instagram')
    // Assert
    cy.get('@clipboard').should('have.been.calledOnceWith', Cypress.sinon.match(new RegExp(`^https?://.+/event/${EVENT_ID}\\?ref=abcd2345$`)))
    cmsEditEventPage.assertToast('success', 'Link copiado')
  })

  whenOn('CT-286-cms-tracking-remover: remover pede confirmação; cancelar não apaga, confirmar apaga e avisa', () => {
    // Arrange
    cmsEditEventPage.visitMocked(EVENT_ID)
    cy.wait('@trackingLinks')
    cy.intercept('DELETE', new RegExp(`/events/${EVENT_ID}/tracking-links/link-2$`), { statusCode: 200, body: { message: 'ok' } }).as('removeLink')
    // Act (cancelar)
    cmsEditEventPage.remove('WhatsApp')
    cy.getBySel('delete-modal').should('be.visible').and('contain.text', 'WhatsApp')
    cmsEditEventPage.cancelRemove()
    // Assert
    cy.getBySel('delete-modal').should('not.exist')
    // Act (confirmar)
    cmsEditEventPage.remove('WhatsApp')
    cmsEditEventPage.confirmRemove()
    // Assert
    cy.wait('@removeLink')
    cmsEditEventPage.assertToast('success', 'Link removido')
    cy.get('@removeLink.all').should('have.length', 1)
  })

  whenOn('CT-287-cms-tracking-estados: lista vazia mostra estado vazio; erro mostra aviso com "Tentar de novo"', () => {
    // Arrange + Act (vazio)
    cmsEditEventPage.visitMocked(EVENT_ID, { links: 'cms/tracking-links-empty' })
    // Assert
    cy.getBySel('tracking-links-empty').should('be.visible')
    // Arrange + Act (erro)
    cmsEditEventPage.visitMocked(EVENT_ID, { linksStatus: 500 })
    // Assert
    cy.getBySel('tracking-links-error', { timeout: 30000 }).should('be.visible').and('contain.text', 'Tentar de novo')
  })

  whenOn('CT-288-cms-tracking-erro-criar: 400 do backend (limite) vira toast de erro e o rótulo fica no campo', () => {
    // Arrange
    cmsEditEventPage.visitMocked(EVENT_ID)
    cy.wait('@trackingLinks')
    cy.intercept('POST', new RegExp(`/events/${EVENT_ID}/tracking-links$`), { statusCode: 400, body: { message: 'Limite' } }).as('createLink')
    // Act
    cmsEditEventPage.createLink('Excedente')
    // Assert
    cy.wait('@createLink')
    cmsEditEventPage.assertToast('error', 'Limite de 50 links')
    cy.getBySel('tracking-links-label-input').should('have.value', 'Excedente')
  })

  whenOff('CT-289-cms-tracking-flag-desligada: sem a flag, a seção não aparece na edição do evento', () => {
    // Arrange + Act
    cmsEditEventPage.visitMocked(EVENT_ID)
    // Assert
    cy.getBySel('panel-details').should('be.visible')
    cy.getBySel('tracking-links-section').should('not.exist')
  })

  whenRealFlow('CT-291-cms-tracking-real: dono cria "Instagram" pelo CMS e o link nasce no banco com 0 visualizações', () => {
    // Arrange
    cy.localOwnedEvent().then(({ eventId, ownerEmail }) => {
      cy.dbQuery(`delete from "EventTrackingLink" where "eventId"='${eventId}'`)
      cmsEditEventPage.visitReal(eventId, ownerEmail, LOCAL_TEST_PASSWORD)
      // Act
      cmsEditEventPage.createLink('Instagram')
      // Assert
      cmsEditEventPage.assertToast('success', 'Link criado')
      cmsEditEventPage.assertItem('Instagram', { views: 0, urlIncludes: `/event/${eventId}?ref=` })
      cy.dbQuery(`select code from "EventTrackingLink" where "eventId"='${eventId}' and label='Instagram'`).should('match', /^[a-km-np-z2-9]{8}$/)
      cy.dbQuery(`delete from "EventTrackingLink" where "eventId"='${eventId}'`)
    })
  })
})
