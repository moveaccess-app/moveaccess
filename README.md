# MoveAccess

Aplicação web desenvolvida com Next.js, TypeScript, e Clean Architecture com Dependency Injection.

## 🏗️ Arquitetura

Este projeto segue os princípios de **Clean Architecture** com separação clara de responsabilidades em camadas:

- **Domain** - Entidades e Value Objects (lógica de negócio pura)
- **Application** - Use Cases e Ports (interfaces)
- **Interface** - Controllers, DI e Validação
- **Infrastructure** - Adaptadores e implementações concretas

### Injeção de Dependências
Utilizamos [tsyringe](https://github.com/microsoft/tsyringe) para gerenciar dependências de forma modular e testável.

## 🚀 Como Começar

### Pré-requisitos
- Node.js 20+ 
- npm

### Instalação

```bash
# Instalar dependências
npm install
```

### Desenvolvimento

```bash
# Executar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Build de Produção

```bash
# Criar build otimizado
npm run build

# Executar build de produção
npm start
```

### Linting

```bash
# Verificar código com ESLint
npm run lint
```

## 📁 Estrutura do Projeto

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/login/       # Autenticação
│   │   └── user/[id]/        # Usuários
│   ├── layout.tsx            # Layout raiz
│   └── page.tsx              # Página inicial
└── server/
    └── core/
        ├── domain/           # Entidades e Value Objects
        ├── application/      # Use Cases e Ports
        ├── interface/        # Controllers, DI, Validação
        └── infra/            # Implementações (Cache, HTTP, Logging)
```

## 🛠️ Tecnologias

### Core
- [Next.js 16](https://nextjs.org/) - React framework com App Router
- [React 19](https://react.dev/) - UI library
- [TypeScript 5](https://www.typescriptlang.org/) - Type safety

### Arquitetura
- [tsyringe](https://github.com/microsoft/tsyringe) - Dependency Injection
- [Zod](https://zod.dev/) - Schema validation
- [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) - Metadata reflection

### Estilo
- [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS
- [ESLint](https://eslint.org/) - Code linting

## 📖 Documentação

Para informações detalhadas sobre o projeto:

- [Planos de Execução](./Doc/ExecutionPlans/) - Histórico de mudanças e melhorias

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm start` | Executa build de produção |
| `npm run lint` | Executa linter |

## 🔗 Links Úteis

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação TypeScript](https://www.typescriptlang.org/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
