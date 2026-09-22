const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 30;

Cypress.Commands.add('getVerificationPin', (emailUser) => {
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