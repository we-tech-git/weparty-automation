// Casca do CMS: topo, menu lateral (desktop) e barra inferior (mobile).
class CmsShellPage {
  topbar () { return cy.getBySel('cms-topbar') }
  sidebar () { return cy.getBySel('cms-sidebar') }
  bottomNav () { return cy.getBySel('cms-bottom-nav') }

  assertDesktopNav () {
    this.sidebar().should('be.visible')
    this.bottomNav().should('not.be.visible')
  }

  assertMobileNav () {
    this.bottomNav().should('be.visible')
    this.sidebar().should('not.be.visible')
  }

  assertActive (slug) {
    this.sidebar().find(`[data-testid="nav-${slug}"]`).should('have.attr', 'aria-current', 'page')
  }

  assertNavMissing (slug) {
    this.sidebar().find(`[data-testid="nav-${slug}"]`).should('not.exist')
  }

  logout () {
    cy.get('[aria-haspopup="menu"][aria-label]').first().hydrated().click()
    cy.get('[role="menuitem"]').last().click()
  }
}

export const cmsShellPage = new CmsShellPage()
