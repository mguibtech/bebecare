# Setup local — BebeCare

Guia técnico para subir o BebeCare no seu ambiente de desenvolvimento.

## Pré-requisitos

- **Node.js 20+** (LTS)
- **Docker Desktop** (Windows / macOS / Linux)
- **JDK 17** (apenas para o mobile — recomendo Temurin)
- **Android Studio** com SDK Platform 35, Build-Tools 35, Platform-Tools e um emulador (AVD) configurado
- (Opcional) **Xcode** em macOS para rodar no iOS

Variáveis de ambiente esperadas no Windows:

- `ANDROID_HOME` → `%LOCALAPPDATA%\Android\Sdk`
- `JAVA_HOME` → caminho da JDK 17
- Adicionar `%ANDROID_HOME%\platform-tools` ao `PATH`

> **Shell no Windows:** os scripts npm (`npm run db:up` etc.) rodam pelo `cmd.exe` internamente, então funcionam sempre. Se você copiar comandos individuais do guia e rodar manualmente, prefira **PowerShell 7+** ou `cmd` — o PowerShell 5.1 (antigo) não suporta `&&`.

## 1. Banco de dados

Na raiz do repositório:

```powershell
copy .env.example .env
npm run db:up
```

Sobe dois containers:

- `bebecare-postgres` na porta `5432` (ou outra que você definir em `POSTGRES_PORT`)
- `bebecare-pgadmin` em `http://localhost:5050` (login com `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` do `.env`)

> Se você já tem outro Postgres rodando na 5432 (ex.: stack da empresa, instalação local), troque `POSTGRES_PORT` para `5433` no `.env` da raiz **e** em `apps/api/.env`. O Docker fará `host:5433 → container:5432`.

Conferir status:

```powershell
docker compose ps
```

A coluna PORTS deve mostrar algo como `0.0.0.0:5432->5432/tcp` (ou `5433->5432/tcp`).

## 2. API (NestJS)

```powershell
copy apps\api\.env.example apps\api\.env
npm run api:install
npm run api:dev
```

A API sobe em:

- **Base URL:** `http://localhost:3000/api`
- **Swagger:** `http://localhost:3000/api/docs`
- **Healthcheck:** `GET /api/health` — deve retornar `{ "status": "ok", "db": "up", ... }`

### Migrations TypeORM

```powershell
cd apps\api

# Gerar a partir das mudanças nas entidades
npm run migration:generate -- src/database/migrations/NomeDaMigration

# Criar vazia (escrever SQL na mão)
npm run migration:create src/database/migrations/NomeDaMigration

# Aplicar / reverter
npm run migration:run
npm run migration:revert
```

Sempre que criar ou alterar uma `*.entity.ts`, gere a migração correspondente.

## 3. Mobile (React Native CLI)

A pasta `apps/mobile/` começa **vazia de propósito** — o `init` do RN CLI precisa rodar no seu Windows real para gerar os projetos nativos Android e iOS corretamente.

Siga as instruções específicas em [`apps/mobile/README.md`](../apps/mobile/README.md).

Resumo do fluxo:

```powershell
cd apps\mobile
npx @react-native-community/cli@latest init BebeCareMobile --version latest --skip-install
# (mover conteúdo de BebeCareMobile/ para apps/mobile/ — instruções no README)
npm install
npm start                # Metro bundler
npm run android          # em outro terminal, com emulador aberto
```

## Scripts orquestradores (raiz)

| Script                   | O que faz                                            |
| ------------------------ | ---------------------------------------------------- |
| `npm run db:up`          | Sobe Postgres + pgAdmin via docker compose           |
| `npm run db:down`        | Para os containers                                   |
| `npm run db:reset`       | Apaga volumes e recria o banco do zero               |
| `npm run db:logs`        | Tail dos logs do Postgres                            |
| `npm run api:install`    | `npm install` dentro de `apps/api`                   |
| `npm run api:dev`        | Roda a API em watch                                  |
| `npm run api:lint`       | Lint da API                                          |
| `npm run api:test`       | Testes da API                                        |
| `npm run mobile:install` | `npm install` dentro de `apps/mobile`                |
| `npm run mobile:start`   | Inicia o Metro bundler                               |
| `npm run mobile:android` | Roda o app no emulador/dispositivo Android           |
| `npm run mobile:ios`     | Roda o app no simulador iOS (macOS)                  |

## Estrutura do monorepo

```
BebeCare/
├── apps/
│   ├── api/                     # NestJS + TypeORM
│   │   ├── src/
│   │   │   ├── main.ts          # bootstrap (ValidationPipe, CORS, Swagger)
│   │   │   ├── app.module.ts    # módulo raiz
│   │   │   ├── config/          # configs (database etc.)
│   │   │   ├── database/        # data-source e migrations
│   │   │   ├── health/          # healthcheck
│   │   │   └── modules/         # features (auth, users, babies, vaccines, ...)
│   │   └── test/
│   └── mobile/                  # React Native CLI (criado pelo init)
├── docs/
│   └── SETUP.md                 # este arquivo
├── .github/
│   ├── workflows/               # CI no GitHub Actions
│   └── ISSUE_TEMPLATE/
├── docker-compose.yml
├── .env.example
└── README.md
```

> **Decisão de arquitetura:** monorepo "de pobre" — `apps/api` e `apps/mobile` são projetos **independentes** (cada um com seu `package.json` e `node_modules`). Não usamos npm/yarn/pnpm workspaces para evitar atrito do React Native CLI com hoisting de `node_modules`. Compartilhamento de tipos, se necessário, será feito copiando arquivos ou publicando um pacote `@bebecare/shared`.

## Convenções

- TypeScript em tudo
- Nomes de variáveis, funções e arquivos em **inglês**
- Comentários no código em **português**
- Backend: NestJS com decorators, DTOs validados via `class-validator`, guards JWT
- Sempre criar **migração TypeORM** ao adicionar/alterar entidade
- Mobile: hooks do React Query gerados junto com cada endpoint da API
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
