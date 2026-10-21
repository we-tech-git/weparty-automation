// Rotas do we-party-web-app usadas pelos testes. Centralizadas aqui para
// nunca repetir uma string de rota solta em spec/page object.
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  FEED: '/feed',
  EXPLORE: '/explore',
  UPDATES: '/updates',
  PROFILE: '/profile',
  INTEREST_PREFIX: '/interests/',
}

// Rotas do we-party-cms (espaço do produtor/admin), relativas ao `cmsUrl`.
export const CMS_ROUTES = {
  LOGIN: '/login',
  ADMIN_REPORTS: '/cms/admin/reports',
  NEW_EVENT: '/cms/producer/new-event',
}

// Rotas adicionais do CMS (WEPARTY-232 — novo layout).
Object.assign(CMS_ROUTES, {
  HOME: '/cms/home',
  MY_EVENTS: '/cms/producer/my-events',
  ADMIN_USERS: '/cms/admin/users',
})
