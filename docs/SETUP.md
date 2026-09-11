# WeParty - Automação de Testes

Documentação para configuração e execução dos testes automatizados do projeto WeParty.

## Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm** versão 9 ou superior
- Navegador **Chrome** ou **Edge** instalado (utilizado pelo Cypress)

## Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd weparty-automation

# Instale as dependências
npm install
```

## Configuração das credenciais de teste

O projeto utiliza um arquivo de fixture para armazenar as credenciais de teste. Este arquivo **não é versionado** por conter dados sensíveis.

1. Copie o arquivo de exemplo:
   ```bash
   cp cypress/fixtures/users/credentials.example.json cypress/fixtures/users/credentials.json
   ```

2. Edite `cypress/fixtures/users/credentials.json` com as credenciais de teste:
   ```json
   {
     "email": "seu-email@teste.com",
     "password": "sua-senha"
   }
   ```

## Comandos

| Comando | Descrição |
|---|---|
| `npx cypress open` | Abre o Cypress em modo interativo (UI) para executar os testes |
| `npx cypress run` | Executa todos os testes em modo headless |
| `npm run cy:run:login` | Executa apenas o teste de login |

## Estrutura do Projeto

Ver [`../AGENTES.md`](../AGENTES.md) para as regras de padronização e o
índice completo da documentação em `docs/`.

```
weparty-automation/
├── cypress/
│   ├── e2e/
│   │   └── public/
│   │       └── login.cy.js       # Testes de login
│   ├── fixtures/
│   │   ├── users/
│   │   │   ├── credentials.example.json  # Template de credenciais
│   │   │   └── credentials.json          # Credenciais reais (não versionado)
│   │   └── api/
│   │       └── login-success.json        # Respostas de API mockadas
│   └── support/
│       ├── pages/             # Page Objects (seletores e ações por tela)
│       ├── commands/          # Custom commands, um arquivo por domínio
│       ├── constants/         # Rotas e timeouts centralizados
│       └── e2e.js             # Configuração global dos testes
├── docs/
│   ├── SETUP.md                        # Esta documentação
│   ├── arquitetura-e-organizacao.md    # Estrutura, Page Objects, nomenclatura
│   ├── escrita-de-testes.md            # AAA, independência, timeouts
│   ├── dados-e-integracao.md           # Seletores, massa de dados, mocks
│   ├── processo.md                     # Branch, commits, lint
│   ├── ci-cd.md                        # Plano futuro de CI/CD
│   └── massa-de-teste.md               # Massa de teste (não versionado)
├── AGENTES.md                 # Regras de padronização (ponto de entrada)
├── cypress.config.js          # Configuração do Cypress
├── package.json               # Dependências e scripts
└── .gitignore                 # Arquivos ignorados pelo Git
```
