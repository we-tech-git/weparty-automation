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
   cp cypress/fixtures/credentials.example.json cypress/fixtures/credentials.json
   ```

2. Edite `cypress/fixtures/credentials.json` com as credenciais de teste:
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
| `npx cypress run --spec "cypress/e2e/login.cy.js"` | Executa apenas o teste de login |

## Estrutura do Projeto

```
weparty-automation/
├── cypress/
│   ├── e2e/                  # Testes end-to-end
│   │   └── login.cy.js       # Teste de login
│   ├── fixtures/             # Dados de teste
│   │   ├── credentials.example.json   # Template de credenciais
│   │   └── credentials.json           # Credenciais reais (não versionado)
│   └── support/              # Arquivos de suporte
│       ├── commands.js       # Comandos customizados
│       └── e2e.js             # Configuração global dos testes
├── docs/
│   ├── SETUP.md              # Esta documentação
│   └── massa-de-teste.md     # Documentação da massa de teste (não versionado)
├── cypress.config.js         # Configuração do Cypress
├── package.json              # Dependências e scripts
└── .gitignore                # Arquivos ignorados pelo Git
```
