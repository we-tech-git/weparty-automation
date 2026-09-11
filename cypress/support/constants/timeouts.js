// Overrides pontuais de timeout — só usar quando o default do
// cypress.config.js (defaultCommandTimeout/responseTimeout) não é
// suficiente para uma tela especificamente mais lenta. Nunca usar um
// número solto direto num spec ou page object.
export const LOGIN_FORM_VISIBLE_TIMEOUT = 15000
export const LOGIN_REDIRECT_TIMEOUT = 20000
