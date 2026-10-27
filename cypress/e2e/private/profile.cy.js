import { profilePage } from '../../support/pages/ProfilePage'
import { FEED_EVENTS_REQUEST_TIMEOUT, PROFILE_VISIBLE_TIMEOUT } from '../../support/constants/timeouts'

// Página de perfil do usuário logado (`/profile`). Todas as leituras são
// mockadas (a suíte roda contra produção com token de login mockado) e toda
// escrita é interceptada: nada é persistido no backend real.
// Ver docs/dados-e-integracao.md.

function openProfile () {
  profilePage.visit()
  profilePage.waitProfileRequest()
  profilePage.assertLoaded()
}

describe('Perfil do usuário', () => {
  let profile
  let recommendations
  let followers
  let following

  before(() => {
    cy.fixture('api/profile-success').then((fixture) => {
      profile = fixture.data
    })
    cy.fixture('api/user-recommendations').then((fixture) => {
      recommendations = fixture.data.users
    })
    cy.fixture('api/my-followers').then((fixture) => {
      followers = fixture.data.followers
    })
    cy.fixture('api/my-following').then((fixture) => {
      following = fixture.data.following
    })
  })

  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()

    cy.mockFeedReads()
    cy.mockProfileReads()

    cy.loginWithProfileUser()
    cy.wait('@getFeedEvents', { timeout: FEED_EVENTS_REQUEST_TIMEOUT })
  })

  it('CT-250-perfil-dados-basicos: perfil exibe nome, username, bio, entrada, interesses e estatísticas', () => {
    // Act
    openProfile()

    // Assert
    profilePage.assertProfileData({
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      joined: 'Março de 2024',
    })
    profilePage.assertFollowStats({ followers: 42, following: 7 })
    profilePage.assertInterests(['Rock', 'Sertanejo', 'Eletrônico'])
  })

  it('CT-251-perfil-aba-curtidos: a aba Curtidos abre por padrão e lista os eventos curtidos', () => {
    // Act
    openProfile()

    // Assert
    profilePage.assertTabSelected('liked')
    profilePage.assertEventCard(profile.likedEvents[0].name)
  })

  it('CT-252-perfil-aba-confirmados: trocar para Confirmados lista os eventos confirmados e persiste a aba na URL', () => {
    // Arrange
    openProfile()

    // Act
    profilePage.clickTab('confirmed')

    // Assert
    profilePage.assertTabSelected('confirmed')
    profilePage.assertTabInUrl('confirmed')
    profilePage.assertEventCard(profile.eventAttendances[0].event.name)
  })

  it('CT-253-perfil-aba-preferencias: a aba Preferências exibe notificações, idioma, conta e privacidade', () => {
    // Arrange
    openProfile()

    // Act
    profilePage.clickTab('settings')

    // Assert
    profilePage.assertTabSelected('settings')
    profilePage.assertTabInUrl('settings')
    profilePage.assertSettingsVisible()
  })

  it('CT-254-perfil-curtidos-vazio: sem eventos curtidos, a aba Curtidos mostra o estado vazio', () => {
    // Arrange
    cy.mockProfileReads({ profileFixture: 'api/profile-empty' })

    // Act
    openProfile()

    // Assert
    profilePage.assertNoEventCards()
    profilePage.assertLikedEmpty()
  })

  it('CT-255-perfil-confirmados-vazio: sem presenças confirmadas, a aba Confirmados mostra o estado vazio', () => {
    // Arrange
    cy.mockProfileReads({ profileFixture: 'api/profile-empty' })
    openProfile()

    // Act
    profilePage.clickTab('confirmed')

    // Assert
    profilePage.assertNoEventCards()
    profilePage.assertConfirmedEmpty()
  })

  it('CT-256-perfil-seguidores-seguir: abrir seguidores lista a galera e seguir atualiza botão, contador e snackbar', () => {
    // Arrange
    openProfile()
    const amiga = followers.find(user => user.id === 'user-rec-1')
    const banda = followers.find(user => user.id === 'user-rec-3')
    cy.fixture('api/follow-success').then((fixture) => {
      cy.intercept('POST', /\/follow(\?.*)?$/, fixture).as('followRequest')
    })

    // Act
    profilePage.openFollowersModal()
    cy.wait('@getMyFollowers', { timeout: PROFILE_VISIBLE_TIMEOUT })

    // Assert — lista e estados iniciais
    profilePage.assertFollowModalTitle('Seguidores')
    profilePage.assertFollowListItem('Seguidores', amiga.name)
    profilePage.assertFollowListItem('Seguidores', banda.name)
    profilePage.assertFollowButtonText('Seguidores', amiga.id, 'Seguir')
    profilePage.assertFollowButtonText('Seguidores', banda.id, 'Seguindo')

    // Act — seguir quem ainda não é seguido
    profilePage.toggleFollowInModal('Seguidores', amiga.id)

    // Assert — estado otimista confirmado pela API mockada
    cy.wait('@followRequest')
    profilePage.assertFollowButtonText('Seguidores', amiga.id, 'Seguindo')
    profilePage.assertSnackbar(`Você começou a seguir ${amiga.name}`)
    profilePage.assertFollowStats({ followers: 42, following: 8 })
  })

  it('CT-257-perfil-seguindo: abrir Seguindo lista os usuários e mostra a ação de deixar de seguir', () => {
    // Arrange
    openProfile()
    const outro = following[0]

    // Act
    profilePage.openFollowingModal()
    cy.wait('@getMyFollowing', { timeout: PROFILE_VISIBLE_TIMEOUT })

    // Assert
    profilePage.assertFollowModalTitle('Seguindo')
    profilePage.assertFollowListItem('Seguindo', outro.name)
    profilePage.assertFollowButtonText('Seguindo', outro.id, 'Deixar de seguir')
  })

  it('CT-258-perfil-editar-sucesso: salvar nome e bio atualiza o cabeçalho e confirma com snackbar', () => {
    // Arrange
    openProfile()
    cy.fixture('api/profile-update-success').then((fixture) => {
      cy.intercept('PATCH', /\/users\/profile(\?.*)?$/, fixture).as('updateProfile')
      const updated = fixture.data

      // Act
      profilePage.openEditModal()
      profilePage.assertEditModalOpen()
      profilePage.assertEditForm({
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
      })
      profilePage.fillEditForm({
        name: updated.name,
        bio: updated.bio,
      })
      profilePage.saveEdit()

      // Assert
      cy.wait('@updateProfile')
      profilePage.assertEditModalClosed()
      profilePage.assertProfileData({
        name: updated.name,
        username: updated.username,
        bio: updated.bio,
        joined: 'Março de 2024',
      })
      profilePage.assertSnackbar('Perfil atualizado com sucesso')
    })
  })

  it('CT-259-perfil-editar-erro: falha ao salvar mantém o modal aberto, o dado antigo na tela e exibe erro', () => {
    // Arrange
    openProfile()
    cy.fixture('api/profile-update-error').then((fixture) => {
      cy.intercept('PATCH', /\/users\/profile(\?.*)?$/, {
        statusCode: 500,
        body: fixture,
      }).as('updateProfileError')
    })

    // Act
    profilePage.openEditModal()
    profilePage.fillEditForm({ name: 'Nome Que Não Deve Salvar' })
    profilePage.saveEdit()

    // Assert
    cy.wait('@updateProfileError')
    profilePage.assertEditModalOpen()
    profilePage.assertSnackbar('Erro ao salvar perfil. Tente novamente.')
    profilePage.assertHeaderName(profile.name)
  })

  it('CT-260-perfil-buscar-recomendacao: buscar em Quem seguir filtra a lista de recomendações', () => {
    // Arrange
    openProfile()
    recommendations.forEach((user) => {
      profilePage.assertRecommendation(user.name)
    })

    // Act
    profilePage.searchRecommendation('Outro')
    profilePage.waitSearchResults()

    // Assert
    profilePage.assertRecommendationVisible('Outro Usuário')
    profilePage.assertNoRecommendation('Amiga Teste')
  })

  it('CT-261-perfil-compartilhar: compartilhar o perfil abre o ShareSheet com o título do perfil', () => {
    // Arrange
    openProfile()

    // Act
    profilePage.shareProfile()

    // Assert
    profilePage.assertShareSheetVisible(`Perfil de ${profile.name}`)

    // Act — fechar
    profilePage.closeShareSheet()

    // Assert
    profilePage.assertShareSheetHidden()
  })

  it('CT-262-perfil-mobile: o perfil mantém dados e abas visíveis sem overflow horizontal em retrato e paisagem', () => {
    // Arrange
    cy.viewport(375, 812)
    openProfile()

    // Assert — retrato
    profilePage.assertHeaderName(profile.name)
    profilePage.assertTabSelected('liked')
    profilePage.assertNoHorizontalOverflow()

    // Act — paisagem
    cy.viewport(812, 375)

    // Assert — paisagem
    profilePage.assertHeaderName(profile.name)
    profilePage.assertNoHorizontalOverflow()
  })
})
