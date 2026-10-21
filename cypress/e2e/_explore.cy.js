import { LOCAL_TEST_PASSWORD } from '../support/constants/local'
const dump = (name) => cy.document().then((d) => cy.writeFile(`cypress/explore/${name}.txt`, `URL: ${d.location.href}\nSCROLLH: ${d.documentElement.scrollHeight}\n---TEXT---\n${d.body.innerText}\n---HTML---\n${d.body.innerHTML.slice(0, 60000)}`))
describe('explore', () => {
  it('web-app: updates, home, explore, interests', () => {
    cy.visit('/updates'); cy.get('main#main-content', { timeout: 30000 }); dump('updates')
    cy.visit('/'); cy.wait(3000); dump('home')
    cy.visit('/explore'); cy.wait(4000); dump('explore')
  })
  it('web-app: login user, feed, profile, interest page', () => {
    cy.localUserEmail('user', 2).then((email) => {
      cy.visit('/login'); cy.get('input[type="email"]').type(email); cy.get('input[type="password"]').type(LOCAL_TEST_PASSWORD); cy.get('button[type="submit"]').click()
      cy.url({ timeout: 30000 }).should('include', '/feed'); cy.wait(4000)
      cy.getBySel('feed-card-more-options').first().click(); cy.wait(500); dump('feed-menu')
      cy.getBySel('feed-card-report').first().click({ force: true }); cy.wait(800); dump('feed-report-dialog')
      cy.visit('/profile'); cy.wait(4000); dump('profile')
      cy.get('body').then(($b) => { const t = $b.find('[data-testid="profile-interest-tag"]'); if (t.length) { cy.wrap(t.first()).click(); cy.wait(4000); dump('interest-page') } })
    })
  })
  it('cms: reports', () => {
    cy.localUserEmail('admin').then((email) => {
      cy.visit(`${Cypress.env('cmsUrl')}/login`); cy.get('input[type="email"]').type(email); cy.get('input[type="password"]').type(LOCAL_TEST_PASSWORD); cy.get('button[type="submit"]').click()
      cy.url({ timeout: 30000 }).should('not.include', '/login')
      cy.visit(`${Cypress.env('cmsUrl')}/cms/admin/reports`); cy.wait(5000); dump('cms-reports')
      cy.contains('button', 'Eventos').click(); cy.wait(1000); dump('cms-reports-eventos')
    })
  })
})
