const INBOX_ORIGIN = 'https://www.sharklasers.com'
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 30

// O inbox do sharklasers e acessado via cy.request (HTML), nao via cy.visit:
// no navegador do Cypress o site entra em loop de redirecionamento (>20x) e
// carrega scripts de terceiros que lancam uncaught exceptions. O request
// mantem o cookie de sessao (PHPSESSID) entre a listagem e a leitura do email.
Cypress.Commands.add('getVerificationPin', (emailUser) => {
  const inboxUrl = `${INBOX_ORIGIN}/inbox/${emailUser}`

  const findWepartyMailId = (html) => {
    const matches = [...html.matchAll(/"mail_id":"(\d+)","mail_from":"([^"]+)"/g)]
    const wepartyMail = matches.find(([, , from]) => /weparty/i.test(from))
    return wepartyMail ? wepartyMail[1] : null
  }

  const fetchPin = (mailId) => {
    return cy.request(`${INBOX_ORIGIN}/inbox?mail_id=${mailId}`).then(({ body }) => {
      const match = String(body).match(/c[oó]digo de verifica[cç][aã]o[\s\S]{0,500}?(\d{6})/i)
      return match ? match[1] : null
    })
  }

  const pollForPin = (attempts = 1) => {
    if (attempts > MAX_POLL_ATTEMPTS) {
      throw new Error('Timeout: PIN nao encontrado no inbox apos 2.5 minutos')
    }

    return cy.request(inboxUrl).then(({ body }) => {
      const mailId = findWepartyMailId(String(body))

      if (!mailId) {
        cy.log(`Aguardando email... tentativa ${attempts}/${MAX_POLL_ATTEMPTS}`)
        return cy.wait(POLL_INTERVAL_MS).then(() => pollForPin(attempts + 1))
      }

      return fetchPin(mailId).then((pin) => {
        if (!pin) {
          cy.log(`Email encontrado, aguardando PIN... tentativa ${attempts}/${MAX_POLL_ATTEMPTS}`)
          return cy.wait(POLL_INTERVAL_MS).then(() => pollForPin(attempts + 1))
        }

        Cypress.env('VERIFICATION_PIN', pin)
        return pin
      })
    })
  }

  return pollForPin()
})
