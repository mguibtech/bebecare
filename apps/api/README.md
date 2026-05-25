# BebeCare — API (NestJS)

Backend do BebeCare. NestJS 11 + TypeORM + PostgreSQL + JWT.

## Setup

```bash
# 1. Subir o banco (na raiz do monorepo)
cd ../..
docker compose up -d
cd apps/api

# 2. Variáveis de ambiente
cp .env.example .env

# 3. Instalar deps
npm install

# 4. Rodar em watch
npm run start:dev
```

API sobe em **http://localhost:3000/api** e Swagger em **http://localhost:3000/api/docs**.
Healthcheck: **GET /api/health**.

## Migrations

```bash
# Gerar migration a partir das mudanças nas entidades
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Criar migration vazia (para escrever SQL na mão)
npm run migration:create src/database/migrations/NomeDaMigration

# Aplicar / reverter
npm run migration:run
npm run migration:revert
```

Sempre que criar/alterar uma `*.entity.ts`, gere a migração correspondente.

## Estrutura

```
src/
├── main.ts                  # bootstrap (ValidationPipe global, CORS, Swagger)
├── app.module.ts            # módulo raiz (ConfigModule + TypeOrmModule global)
├── config/
│   └── database.config.ts   # factory de config do TypeORM
├── database/
│   ├── data-source.ts       # DataSource standalone usado pelo CLI de migrations
│   └── migrations/
├── health/                  # healthcheck (com ping ao banco)
└── modules/                 # cada feature do BebeCare vai virar um módulo aqui
                             # (auth, users, couples, babies, vaccines, ...)
```

## Convenções

- DTOs com `class-validator` e `class-transformer`
- Guards JWT em rotas autenticadas (a chegar em breve com o módulo `auth/`)
- Nomes em inglês, comentários em português
- Sempre criar migração TypeORM junto com nova entidade
