// Leituras disparadas ao montar o perfil (Profile.vue). Todas são mockadas
// porque a suíte roda contra produção com um token de login mockado — uma
// chamada real responderia 401 e o callApi deslogaria o usuário.
// Nenhuma escrita vive aqui: cada spec registra o intercept da ação que testa.
Cypress.Commands.add('mockProfileReads', ({ profileFixture = 'api/profile-success' } = {}) => {
  cy.fixture('users/profile-account').then(account => {
    cy.fixture(profileFixture).then(fixture => {
      cy.intercept('GET', new RegExp(`/users/${account.id}(\\?.*)?$`), fixture).as('getProfile')
    })
  })
  cy.fixture('api/profile-interests').then(fixture => {
    cy.intercept('GET', /\/users\/interests(\?.*)?$/, fixture).as('getProfileInterests')
  })
  cy.fixture('api/follow-stats').then(fixture => {
    cy.intercept('GET', /\/follow\/stats\/[^/]+(\?.*)?$/, fixture).as('getFollowStats')
  })
  cy.fixture('api/user-recommendations').then(fixture => {
    cy.intercept('GET', /\/social\/recommendations(\?.*)?$/, fixture).as('getRecommendations')

    // A busca de "Quem seguir" é server-side: o SearchInput só emite depois do
    // debounce e a lista é filtrada aqui, como o backend faria.
    cy.intercept('GET', /\/social\/search(\?.*)?$/, (req) => {
      const query = new URL(req.url).searchParams.get('q')?.toLowerCase() ?? ''
      const users = fixture.data.users.filter(user =>
        user.name.toLowerCase().includes(query)
        || (user.username && user.username.toLowerCase().includes(query)),
      )
      req.reply({ statusCode: 200, body: { success: true, data: { users } } })
    }).as('searchUsers')
  })
  // Sugestões do card de interesses (ProfileInterestsCard). Sem este mock a
  // chamada real responde 401 com o token falso e o callApi desloga o usuário.
  cy.fixture('api/interest-recommendations').then(fixture => {
    cy.intercept('GET', /\/interest\/recommendations(\?.*)?$/, fixture).as('getInterestRecommendations')
  })
  cy.fixture('api/my-followers').then(fixture => {
    cy.intercept('GET', /\/follow\/my-followers(\?.*)?$/, fixture).as('getMyFollowers')
  })
  cy.fixture('api/my-following').then(fixture => {
    cy.intercept('GET', /\/follow\/my-following(\?.*)?$/, fixture).as('getMyFollowing')
  })
})

// Login com um usuário cujo `id` casa com a fixture de perfil. O fluxo em si
// é o mesmo de `cy.login()` — só injeta os campos que o backend real devolve.
Cypress.Commands.add('loginWithProfileUser', () => {
  cy.fixture('users/profile-account').then(account => {
    cy.login(account)
  })
})
