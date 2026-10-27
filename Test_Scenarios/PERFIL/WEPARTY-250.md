# WEPARTY-250 — Página de Perfil do Usuário

---

## Cenário Original

DADO
que o usuário está autenticado e acessa a página de perfil

QUANDO
visualiza suas informações e interage com eventos, seguidores, recomendações, compartilhamento e preferências

ENTÃO
tudo deve funcionar corretamente, sem erros, sem quebra de layout e sem alterar dados reais

---

## Cenário Adaptado

### Contexto
- **Dispositivo:** Desktop (viewport 1280×720) e mobile (375×812 em retrato e 812×375 em paisagem)
- **Página alvo:** `/profile` (rota privada)
- **Funcionalidades testadas:** dados do cabeçalho, abas de eventos, estados vazios, seguidores/seguindo, edição de perfil, recomendações, compartilhamento e responsividade
- **Ambiente:** produção (`www.wepartyapp.com`), com login mockado e todas as leituras mockadas

### Pré-condições
- Sessão autenticada criada via `cy.loginWithProfileUser()`
- Respostas de leitura mockadas: perfil, interesses, estatísticas, recomendações, seguidores, seguindo e busca de usuários
- Requisições de escrita (`PATCH /users/profile` e `POST /follow`) interceptadas — nenhum dado real é alterado
- Massa carregada de fixtures em `cypress/fixtures/`

### DADO
que o usuário autenticado acessa a página de perfil

### QUANDO
ele navega entre as abas e utiliza as ações disponíveis na página

### ENTÃO
- O cabeçalho deve exibir nome, `@username`, bio, mês/ano de entrada, interesses e contadores de seguidores/seguindo
- A aba **Curtidos** deve abrir por padrão e listar os eventos curtidos
- A aba **Confirmados** deve listar as presenças confirmadas e refletir a aba na URL (`?tab=confirmed`)
- A aba **Preferências** deve exibir notificações, idioma, conta e privacidade do perfil
- Abas sem eventos devem exibir o estado vazio correspondente
- O modal de **Seguidores** deve listar usuários, permitir seguir e atualizar botão, contador e snackbar
- O modal de **Seguindo** deve listar usuários e exibir a ação **Deixar de seguir**
- A edição deve salvar nome e bio, atualizar o cabeçalho e confirmar com snackbar
- Em caso de erro ao salvar, o modal deve permanecer aberto, o dado antigo deve continuar na tela e o erro deve ser exibido
- A busca em **Quem seguir** deve filtrar a lista de recomendações
- O compartilhamento deve abrir o ShareSheet com o título do perfil e permitir fechar
- No mobile, os dados e as abas devem permanecer visíveis, sem overflow horizontal em retrato e paisagem

### Cenários automatizados

| CT | Cenário | Resultado esperado |
|---|---|---|
| CT-250 | Dados básicos do perfil | Nome, username, bio, entrada, interesses e estatísticas visíveis |
| CT-251 | Aba Curtidos padrão | Aba selecionada e evento curtido listado |
| CT-252 | Aba Confirmados | Aba selecionada, URL com `tab=confirmed` e evento confirmado listado |
| CT-253 | Aba Preferências | Notificações, idioma, conta e privacidade visíveis |
| CT-254 | Curtidos vazio | Nenhum card de evento e mensagem de estado vazio |
| CT-255 | Confirmados vazio | Nenhum card de evento e mensagem de estado vazio |
| CT-256 | Seguidores / seguir | Lista, estados dos botões, novo contador e snackbar após seguir |
| CT-257 | Seguindo | Lista de usuários e ação **Deixar de seguir** |
| CT-258 | Editar perfil com sucesso | Modal fecha, cabeçalho atualiza e snackbar de sucesso |
| CT-259 | Erro ao editar perfil | Modal permanece aberto, dado antigo mantido e erro exibido |
| CT-260 | Buscar recomendação | Lista filtrada; usuário buscado visível e demais ausentes |
| CT-261 | Compartilhar perfil | ShareSheet abre com o título do perfil e fecha com `Esc` |
| CT-262 | Perfil mobile | Dados e abas visíveis, sem overflow horizontal em retrato e paisagem |

### Critérios de aceitação
- **Conteúdo:** dados do cabeçalho, abas, estados vazios e preferências correspondem às fixtures
- **Interação:** seguir, editar, buscar e compartilhar produzem o feedback visual esperado
- **Segurança de dados:** toda escrita é interceptada; nenhum estado é persistido na produção
- **Independência:** cada teste limpa storage, sessão e cookies no `beforeEach`
- **Responsividade:** `scrollWidth` não ultrapassa `clientWidth` no mobile
- **Estabilidade:** nenhum timeout fixo no spec; esperas usam constantes e `cy.wait` de aliases

### Observações da produção
- O perfil **não exibe localização**; o modal de edição também não possui campo de localização. O `PATCH /users/profile` envia apenas `name`, `username` e `bio`.
- Os eventos curtidos vêm de `profile.likedEvents` na resposta de `GET /users/{id}`; os confirmados vêm de `eventAttendances`.
- A busca de recomendações é **server-side** (`GET /social/search?q=...`) e o intercept filtra a fixture pelo termo.
- A rota `GET /interest/recommendations` também precisa ser mockada; sem isso, o token de teste recebe 401 e o app redireciona para `/`.
- A lista **Quem seguir** tem scroll próprio: itens abaixo do corte existem no DOM mas não estão visíveis, por isso os testes diferenciam `exist` de `be.visible`.
- O ShareSheet usa o texto de produção **Compartilhar Evento** também no perfil.

### Arquivos da automação
- Spec: `cypress/e2e/private/profile.cy.js`
- Page Object: `cypress/support/pages/ProfilePage.js`
- Comandos: `cypress/support/commands/profile.js`
- Fixtures: `cypress/fixtures/api/profile-*.json`, `follow-*.json`, `user-recommendations.json`, `my-followers.json`, `my-following.json`, `interest-recommendations.json`
