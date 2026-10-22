const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

module.exports = defineConfig({
  e2e: {
    // Produção por padrão. O ambiente local de validação (agent/env.mjs) define ENV_WEBAPP_URL,
    // ENV_API_URL e ENV_CMS_URL — nesse caso a suíte roda contra localhost, com dados reais
    // (dump anonimizado) e sem os mocks de escrita obrigatórios em produção.
    baseUrl: process.env.ENV_WEBAPP_URL || 'https://www.wepartyapp.com',
    // Mantido do branch local: o signup de produção passa pelo inbox do sharklasers
    // (outra origem) e precisa destas flags no Chromium.
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    modifyObstructiveCode: true,
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
    env: {
      local: Boolean(process.env.ENV_WEBAPP_URL),
      apiUrl: process.env.ENV_API_URL || 'https://api.wepartyapp.com',
      cmsUrl: process.env.ENV_CMS_URL || '',
      mailUrl: process.env.ENV_MAIL_URL || '',
      socialKey: process.env.ENV_SOCIAL_KEY || '',
    },
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args.push('--disable-web-security')
          launchOptions.args.push('--disable-features=IsolateOrigins,site-per-process')
          launchOptions.args.push('--disable-site-isolation-trials')
        }
        return launchOptions
      })

      on('task', {
        // Consulta o Postgres do ambiente local (dump anonimizado) via docker exec. Só existe no modo local.
        dbQuery(sql) {
          if (!process.env.ENV_WEBAPP_URL) throw new Error('dbQuery só funciona no ambiente local (ENV_WEBAPP_URL)');
          const container = `${process.env.ENV_NAME || 'wp-local'}-db-1`;
          return execFileSync('docker', ['exec', container, 'psql', '-U', 'admin', '-d', 'wp', '-tA', '-c', sql], { encoding: 'utf8' }).trim();
        },
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
