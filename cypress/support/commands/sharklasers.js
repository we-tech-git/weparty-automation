const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 30;

Cypress.Commands.add('getVerificationPin', (emailUser, { minMessages = 1 } = {}) => {
  // Ambiente local: o backend envia o e-mail para o Mailpit (caixa de teste) — o PIN é lido pela API dele.
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

  cy.visit(`https://www.sharklasers.com/inbox/${emailUser}`);

  const pollForPin = (attempts = 1) => {
    if (attempts > MAX_POLL_ATTEMPTS) {
      throw new Error('Timeout: PIN nao encontrado no inbox apos 2.5 minutos');
    }

    return cy.get('body').then(($body) => {
      const text = $body.text();
      const textLower = text.toLowerCase();

      if (textLower.includes('weparty')) {
        const pinMatch = text.match(/\b(\d{6})\b/);
        if (pinMatch) {
          Cypress.env('VERIFICATION_PIN', pinMatch[1]);
          return;
        }
      }

      cy.log(`Aguardando email... tentativa ${attempts}/${MAX_POLL_ATTEMPTS}`);
      return cy.wait(POLL_INTERVAL_MS).then(() => cy.reload()).then(() => pollForPin(attempts + 1));
    });
  };

  return cy.wait(POLL_INTERVAL_MS).then(() => pollForPin());
});