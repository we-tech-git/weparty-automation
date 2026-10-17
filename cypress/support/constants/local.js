// Ambiente local de validação (agent/env.mjs): dump ANONIMIZADO da produção.
// Todos os usuários do dump têm esta senha de teste — não é segredo, só existe no banco local.
export const LOCAL_TEST_PASSWORD = 'Teste@123'

// Senha dos cadastros criados pelo signup.cy.js no ambiente local. Precisa atender às regras do formulário
// (mais longa que a do dump). Vale só para contas descartáveis do banco local; em produção vem de CYPRESS_signupPassword.
export const LOCAL_SIGNUP_PASSWORD = 'Cadastro@Teste2026'
