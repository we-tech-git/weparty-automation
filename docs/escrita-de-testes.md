# Escrita de testes

> Ver [`../AGENTES.md`](../AGENTES.md) para o resumo acionável destas regras.

## Padrão AAA (Arrange-Act-Assert)

Em Cypress a cadeia de comandos tende a misturar as três fases; a regra é
**separar visualmente com comentários** e extrair o "Arrange" repetitivo
para `beforeEach` ou Page Object, mantendo cada `it` legível em 3 blocos.

```js
it('CT-001-login-sucesso-lembrar-me: login com sucesso marcando lembrar-me', () => {
  // Arrange
  mockLoginSuccess(credentials.email)
  loginPage.visit()

  // Act
  loginPage.fillCredentials(credentials)
  loginPage.toggleRememberMe()
  loginPage.submit()

  // Assert
  cy.wait('@loginRequest')
  loginPage.assertRedirectedToFeed()
})
```

Não é obrigatório escrever `// Arrange/Act/Assert` literalmente, mas a
ordem e a separação são obrigatórias em todo `it` novo.

## Independência e idempotência

- Todo teste roda sozinho, em qualquer ordem, sem depender de estado
  deixado por outro `it`.
- Estado global (storage, cookies, sessão) é resetado em `beforeEach` —
  já é prática adotada no spec de login e vira regra para todos.
- Evitar `cy.session()` compartilhada entre testes que verificam estados
  diferentes de autenticação.

## Timeouts e esperas

- Timeouts globais ficam no `cypress.config.js` (`defaultCommandTimeout`,
  `requestTimeout`, etc.) — usar essas defaults sempre que possível.
- Quando um override for realmente necessário, o valor vem de uma
  constante nomeada em `support/constants/timeouts.js`, nunca um número
  solto repetido entre `its`.
- Proibido `cy.wait(<ms fixo>)` para "esperar a UI". Esperar sempre por uma
  condição: alias de rede (`cy.wait('@alias')`) ou asserção (`should`).
