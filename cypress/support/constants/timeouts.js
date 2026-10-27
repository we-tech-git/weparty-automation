// Overrides pontuais de timeout — só usar quando o default do
// cypress.config.js (defaultCommandTimeout/responseTimeout) não é
// suficiente para uma tela especificamente mais lenta. Nunca usar um
// número solto direto num spec ou page object.
export const LOGIN_FORM_VISIBLE_TIMEOUT = 15000
export const LOGIN_REDIRECT_TIMEOUT = 20000

// Feed depende do redirect do login (que já tem seu próprio delay) + o
// carregamento assíncrono dos eventos. Além disso Feed.vue só chama
// fetchEvents() (o GET que popula o card) depois de aguardar
// useGeolocation().getCoords() — timeout interno de 10s (ver
// src/composables/useGeolocation.ts) quando a geolocalização é negada ou
// indisponível, como é o caso do Cypress headless — somado ao carregamento
// real (não mockado) dos chunks JS/CSS da SPA a partir de produção. Sem essa
// folga acima do defaultCommandTimeout/requestTimeout padrão, o alias de
// recomendações/comentários e o card estourariam o timeout antes de aparecer.
export const FEED_EVENTS_REQUEST_TIMEOUT = 20000
export const FEED_CARD_VISIBLE_TIMEOUT = 30000

// Pagina de detalhes: carrega o evento + comentarios + trends + status de
// curtida/favorito/presenca a partir de producao (todos mockados no spec).
export const EVENT_DETAILS_VISIBLE_TIMEOUT = 30000

// Perfil: carrega a SPA + perfil, interesses, estatisticas e recomendacoes
// (leituras mockadas). O primeiro render depende dos chunks da SPA em producao.
export const PROFILE_VISIBLE_TIMEOUT = 20000
