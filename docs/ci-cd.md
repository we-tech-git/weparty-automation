# CI/CD — Plano futuro

> Este documento registra a intenção de como a automação deve rodar em CI/CD
> quando isso for implementado. Não há pipeline configurado ainda — este é
> um plano para quando a prioridade permitir, não uma decisão travada.
> Ver também [`../PADROES.md`](../PADROES.md) para as convenções gerais do
> repositório.

## Onde e quando rodar

A decidir quando a implementação começar:
- Ferramenta de CI (ex.: GitHub Actions, já que o código está no GitHub).
- Gatilho: em PR do `we-party-web-app`? Agendado (nightly)? Manual?
- Se roda em todo PR do front, como o resultado é reportado de volta
  (status check, comentário no PR)?

## Separação por criticidade (smoke vs. regressão)

- **Smoke:** subconjunto pequeno de cenários críticos (ex.: login com
  sucesso), roda a cada execução/PR.
- **Regressão completa:** todos os cenários, roda com menor frequência
  (ex.: antes de deploy, ou agendado).
- Mecanismo sugerido: tags/grep de specs (ex.: `cypress-grep` ou convenção
  de nome de arquivo/describe) para selecionar o que roda em cada gatilho.

## Relatórios e evidências

- Screenshot em falha já está habilitado (`screenshotOnRunFailure: true`
  em `cypress.config.js`); manter em CI.
- Vídeo está desligado localmente (`video: false`); avaliar se liga em CI
  para facilitar debug de falhas intermitentes (tem custo de tempo/storage).
- Avaliar relatório estruturado (ex.: `mochawesome`) para visualizar
  resultados de execução em CI, incluindo em PRs.

## Quando revisitar

Assim que a implementação de CI entrar em prioridade, transformar os itens
acima em decisões concretas neste mesmo documento, atualizando o status.
