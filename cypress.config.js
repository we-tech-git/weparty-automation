const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://www.wepartyapp.com',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    video: false,
    screenshotOnRunFailure: true,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: false,
      json: true,
      charts: true,
      reportPageTitle: 'WeParty — Relatório de Testes',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
    setupNodeEvents(on, config) {
      on('task', {
        getNextEmail() {
          const counterPath = path.join(__dirname, 'cypress', 'fixtures', '.email-counter.json');
          let counter = 0;
          try {
            if (fs.existsSync(counterPath)) {
              const data = JSON.parse(fs.readFileSync(counterPath, 'utf-8'));
              counter = data.counter || 0;
            }
          } catch (e) {
            // arquivo inexistente ou corrompido, comeca do 0
          }
          counter++;
          const padded = String(counter).padStart(4, '0');
          const emailUser = `weparty.test.${padded}`;
          const email = `${emailUser}@sharklasers.com`;
          fs.writeFileSync(counterPath, JSON.stringify({ counter }, null, 2));
          return { email, emailUser };
        },
      });
      return config;
    },
  },
});
