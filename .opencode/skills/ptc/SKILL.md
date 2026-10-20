---
name: ptc
description: Protocolo de Testes Cypress (PTC). Use SEMPRE que executar testes com Cypress neste repositório — qualquer spec, cenário, teste E2E, smoke, regressão, depuração, spec isolado ou suíte completa. Toda execução deve gerar/atualizar o relatório HTML em cypress/reports/report.html antes de encerrar a sessão.
---

# PTC — Protocolo de Testes Cypress

Regra central: **nenhuma execução de testes Cypress termina sem o relatório HTML
atualizado**. O relatório é a fonte de verdade da sessão e fica em
`cypress/reports/report.html`.

## Regras obrigatórias

1. **Sempre gerar o relatório.** Vale para qualquer tipo de teste: E2E,
   component, smoke, regressão, spec isolado, teste novo ou suíte completa.
2. **Nunca encerrar a tarefa com relatório desatualizado.** Se os testes
   rodaram, o HTML precisa refletir a execução.
3. **Comando canônico = suíte completa.** Usar `npm test` ou `npm run cy:run`
   sempre que possível, porque é o que faz o HTML listar **todos** os specs.
4. **Execuções focadas são intermediárias.** Durante depuração pode usar
   `npm run cy:run -- --spec "cypress/e2e/<caminho>.cy.js"`, os atalhos
   (`npm run cy:run:login`, `cy:run:feed`, `cy:run:detalhes`, `cy:run:signup`)
   ou outro tipo (`npm run cy:run -- --component`). Antes de encerrar a
   sessão, rodar a suíte completa (`npm test`) para o relatório final conter
   todos os testes.
5. **Se rodar o Cypress direto** (`npx cypress run`, `cypress run`), rodar
   `npm run report` logo depois — inclusive quando os testes falharem.
6. **Falhas não dispensam o relatório.** Os scripts preservam o exit code dos
   testes e geram o HTML mesmo em falha. Nunca usar `|| true` nem mascarar o
   resultado.
7. **Modo interativo (`cypress open`) não gera relatório.** Se a sessão
   interativa contar como sessão de testes, rodar o spec via script (`npm run
   cy:run -- --spec ...`) ao final para atualizar o HTML.
8. **Spec novo entra no relatório.** Antes de concluir, rodar a suíte completa
   (`npm test`) para que ele apareça junto dos demais.
9. **Não gerar o HTML com marge** nem editar `cypress/reports/report.html` à
   mão. A página é gerada por `scripts/generate-report.js` com o design do
   WeParty.
10. **Não apagar relatórios manualmente.** A limpeza é feita pelo
    `scripts/run-tests.js` no início de cada execução.
11. **Ao terminar, informe o caminho** `cypress/reports/report.html` e o
    resumo da execução (specs, total, passaram, falharam, duração).

## Fluxo padrão

1. Depurar com execuções focadas, se necessário (cada uma já atualiza o HTML).
2. Rodar a suíte completa (`npm test`) para o relatório final incluir todos os
   specs.
3. Confirmar que `cypress/reports/report.html` foi gerado/atualizado agora.
4. Conferir no relatório que os specs executados aparecem com os números
   corretos.
5. Responder ao usuário com o resumo e o caminho do HTML.

## Definition of done

- [ ] Os testes foram executados via script do projeto.
- [ ] A última execução foi a suíte completa (`npm test`), salvo pedido
      explícito do usuário para rodar apenas um spec.
- [ ] `cypress/reports/report.html` existe e foi atualizado após a execução.
- [ ] O HTML lista todos os specs/testes, com os resultados corretos.
- [ ] O caminho do relatório foi informado ao usuário.

## Anti-padrões

- Rodar `npx cypress run` e esquecer `npm run report`.
- Dizer que passou/falhou sem abrir/validar o relatório gerado.
- Reutilizar um `report.html` antigo como se fosse da execução atual.
- Rodar só um spec e afirmar que a página contém todos os testes.
- Trocar o gerador por marge ou por outro template sem pedido explícito.
