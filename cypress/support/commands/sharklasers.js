const INBOX_ORIGIN = 'https://www.sharklasers.com'
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 30

Cypress.Commands.add('getVerificationPin', (emailUser, { minMessages = 1 } = {}) => {
  // Ambiente local: o backend envia o e-mail para o Mailpit (caixa de teste) - o PIN é lido pela API dele.
  if (Cypress.env('local')) {
    const para = `${emailUser}@sharklasers.com`
    const buscar = (tentativa = 1) =>
      cy.request({ url: `${Cypress.env('mailUrl')}/api/v1/search`, qs: { query: `to:${para}` }, failOnStatusCode: false }).then((res) => {
        // Mailpit lista da mais nova para a mais antiga; `minMessages` espera um reenvio (cada visita a /confirm-email reenvia o código).
        const msg = (res.body?.messages_count ?? 0) >= minMessages ? res.body.messages[0] : null
        if (!msg) {
          if (tentativa > 15) throw new Error(`Mailpit: nenhum e-mail para ${para}`)
          return cy.wait(1000).then(() => buscar(tentativa + 1))
        }
        return cy.request(`${Cypress.env('mailUrl')}/api/v1/message/${msg.ID}`).then((m) => {
          const pin = (m.body.Text || m.body.HTML || '').match(/\b(\d{6})\b/)?.[1]
          expect(pin, 'PIN de 6 dígitos no e-mail local').to.match(/^\d{6}$/)
          Cypress.env('VERIFICATION_PIN', pin)
        })
      })
    return buscar()
  }

  // Produção: o inbox do sharklasers é acessado via cy.request (HTML), não via cy.visit:
  // no navegador do Cypress o site entra em loop de redirecionamento (>20x) e carrega
  // scripts de terceiros que lançam uncaught exceptions. O request mantém o cookie de
  // sessão (PHPSESSID) entre a listagem e a leitura do e-mail.
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
