# 🚀 Deploy de produção — BebeCare

Runbook pra colocar o BebeCare no ar. O **código já está pronto pra produção**
(porta dinâmica, SSL no Postgres, healthcheck, crons, i18n) — o que falta é
**provisionar as contas externas** e configurar as env vars. Cada passo abaixo
é uma ação sua nos painéis dos provedores.

> Documento de trabalho interno (raiz do repo, fora de `/docs` que é público).

## Arquitetura de produção

```
  App mobile (Android)
        │  HTTPS + Accept-Language
        ▼
  API NestJS  ──────►  Postgres (mesmo projeto, rede privada)
  (Railway service)
        │
        └──►  Firebase Admin (FCM push)

  Distribuição do app: Firebase App Distribution (Play Store adiada)
```

- **API:** Railway — Node (Railpack), config as code em `apps/api/railway.json`.
- **Banco:** Postgres do próprio Railway (service no mesmo projeto).
- **Push:** Firebase Admin SDK (service account de produção).
- **Mobile:** APK release assinado → **Firebase App Distribution** (testers por
  e-mail, `npm run distribute`). Play Store fica pra uma fase futura —
  [PLAY_STORE.md](PLAY_STORE.md) continua válido pra quando chegar a hora.

> Decisão de 7 ago 2026: Render/Neon → **Railway** (banco + API juntos) e
> Play Store → **App Distribution**. O `render.yaml` da raiz fica como
> referência histórica.

---

## Pré-requisitos (contas)

| Serviço | Pra quê | Custo V1 |
|---|---|---|
| [Railway](https://railway.com) | API + Postgres | Hobby ~US$ 5/mês (inclui US$ 5 de uso); serviços não dormem |
| [Firebase](https://console.firebase.google.com) | Push (FCM) + App Distribution | Free |

---

## Passo 1 — Projeto no Railway (API + banco)

1. [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo**
   → conecte o repo do BebeCare. (O 1º deploy vai falhar — normal, falta o
   root directory e o banco.)
2. No service criado → **Settings → Source → Root Directory = `apps/api`**.
   A partir daí o Railway lê o **`apps/api/railway.json`** (build, start,
   healthcheck `/api/health`, migrations no pre-deploy) — não precisa
   configurar comando nenhum no painel.
3. No mesmo projeto: **Create → Database → PostgreSQL**. Cria o service
   `Postgres` já com as vars `PGHOST/PGUSER/PGPASSWORD/...`.
4. API↔banco conversam pela **rede privada** do projeto (sem egress).

## Passo 2 — Env vars da API (Railway)

No service da API → **Variables**. Pros valores do Postgres, use **references**
(sintaxe `${{Postgres.VAR}}` — se o service do banco tiver outro nome, ajuste):

```
NODE_ENV=production
# Railway injeta PORT sozinho — o main.ts já lê process.env.PORT.
POSTGRES_HOST=${{Postgres.PGHOST}}
POSTGRES_PORT=${{Postgres.PGPORT}}
POSTGRES_USER=${{Postgres.PGUSER}}
POSTGRES_PASSWORD=${{Postgres.PGPASSWORD}}
POSTGRES_DB=${{Postgres.PGDATABASE}}
JWT_SECRET=...           # gere: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FIREBASE_PROJECT_ID=...      # ver Passo 3
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

> **SSL:** `NODE_ENV=production` liga TLS na conexão. A imagem de Postgres do
> Railway aceita TLS (cert self-signed — coberto pelo
> `rejectUnauthorized: false`). Se o deploy falhar com erro de SSL na rede
> privada, defina `POSTGRES_SSL=false` — desde 7 ago o `false` explícito
> desliga o TLS mesmo em prod (`database.config.ts` + `data-source.ts`).
>
> A API sobe sem as 3 vars do Firebase (push entra em modo "desabilitado",
> loga avisos). Configure-as quando o push de produção for necessário.

Por fim: **Settings → Networking → Generate Domain** → anote a URL pública
(`https://<algo>.up.railway.app`) — o mobile vai apontar pra ela (seção Mobile,
item 0).

## Passo 3 — Firebase (service account de produção)

1. Console do Firebase → **Configurações do projeto → Contas de serviço**.
2. **Gerar nova chave privada** → baixa um JSON.
3. Copie 3 campos do JSON pras env vars do Railway:
   - `project_id`   → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key`  → `FIREBASE_PRIVATE_KEY` (mantenha os `\n` literais —
     cole o valor exatamente como está no JSON, com as quebras escapadas).

## Passo 4 — Migrations em produção

As tabelas + o seed do PNI vêm das migrations (não há `synchronize`).

**No Railway é automático:** o `railway.json` define como `preDeployCommand`
`npx typeorm migration:run -d dist/database/data-source.js` — usa o **JS já
compilado** pelo build (não depende de ts-node/devDeps) e roda antes de cada
deploy ir ao ar, com as mesmas env vars do service. Idempotente: sem migration
nova, não faz nada. Confira nos logs do deploy a fase "pre-deploy".

Pra rodar manualmente contra o banco de prod (raro — debug): habilite o **TCP
proxy público** no service Postgres (Settings → Public Networking) e use as
credenciais dele com SSL:

```bash
cd apps/api
POSTGRES_SSL=true POSTGRES_HOST=<xxx>.proxy.rlwy.net POSTGRES_PORT=<porta_do_proxy> \
POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=railway npm run migration:run
```

## Passo 5 — 🔐 Segurança (fazer agora)

- **Rotacionar a chave do Firebase** que apareceu no chat (service account do
  projeto `bebecareapp-61508`, exposta em 27 mai): gere uma nova (Passo 3),
  atualize o `apps/api/.env` local + as vars do Railway, e **apague a antiga**
  no Google Cloud → IAM → Contas de serviço → chaves.
- O `apps/api/.env` **não está versionado** (confirmado: coberto pelo
  `.gitignore`). Mantenha assim — segredos só em `.env` local e nos painéis.

---

## ✅ Já pronto no código (não precisa fazer nada)

| Item | Onde |
|---|---|
| Porta dinâmica (`process.env.PORT`) + bind `0.0.0.0` | `apps/api/src/main.ts` |
| SSL no Postgres em prod (`POSTGRES_SSL=false` desliga se precisar) | `database.config.ts` + `data-source.ts` |
| Config as code do Railway (build/start/health/migrations) | `apps/api/railway.json` |
| Script de distribuição (APK → App Distribution) | `apps/mobile/scripts/distribute.mjs` (`npm run distribute`) |
| Healthcheck `GET /api/health` (503 se DB cair) | `apps/api/src/health/` |
| Cron de limpeza de convites (diário 3h) | `families/jobs/family-invites-cleanup.job.ts` |
| Lembrete de consulta (cron 5 min, FCM) | `appointments/jobs/appointments-reminder.job.ts` |
| i18n pt/en (mobile + catálogo de vacinas via `Accept-Language`) | toda a stack |
| CI de lint/types/testes (API + mobile) | `.github/workflows/*-ci.yml` |

---

## Mobile — distribuição via Firebase App Distribution

> Fase atual: **sem Play Store**. Builds de release vão pros testers (a família)
> pelo **Firebase App Distribution** — um comando local, testers recebem e-mail
> com o link do APK. O `build.gradle` **já está pronto** pra release assinado
> (signing + versionCode dinâmico, com fallback pro debug). `npm run android`
> (debug) segue funcionando sem keystore.

### 0. Apontar o app pra API de produção ⚠️

O `apps/mobile/src/shared/config/env.ts` escolhe a URL por build:
release (`__DEV__ === false`) usa `API_BASE_URL_PROD`; dev usa `localhost`.
**Antes do primeiro build distribuído**, troque o valor de `API_BASE_URL_PROD`
(hoje aponta pro placeholder antigo do Render) pelo domínio gerado no Railway,
mantendo o sufixo `/api` — ex.: `https://<algo>.up.railway.app/api`.

### 1. Gerar o upload keystore (uma vez)

Num diretório **fora do repo** (ex.: `C:\keys`):

```bash
keytool -genkeypair -v -keystore bebecare-upload.keystore \
  -alias bebecare -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o arquivo + as senhas num cofre. **Perder o keystore = testers precisam
desinstalar/reinstalar** (e é o mesmo keystore que vai pra Play depois).

### 2. Fornecer as props de assinatura (uma vez)

O `build.gradle` lê as props `BEBECARE_UPLOAD_*` (fallback pro debug quando
ausentes). Coloque no **`%USERPROFILE%\.gradle\gradle.properties`** (global do
Gradle, fora do repo — crie o arquivo se não existir):

```properties
BEBECARE_UPLOAD_STORE_FILE=C:/keys/bebecare-upload.keystore
BEBECARE_UPLOAD_STORE_PASSWORD=...
BEBECARE_UPLOAD_KEY_ALIAS=bebecare
BEBECARE_UPLOAD_KEY_PASSWORD=...
# opcional: suba manualmente a cada build distribuído (fallback 1)
BEBECARE_VERSION_CODE=1
```

> Caminho absoluto com barras normais (`C:/...`) — o `file()` do Gradle resolve
> relativo a `android/app`, então relativo quebraria.

### 3. App Distribution (console do Firebase, uma vez)

1. [Console](https://console.firebase.google.com) → projeto → **App Distribution**
   → **Começar** (no app Android `com.bebecare`).
2. Aba **Testadores e grupos** → criar grupo com alias **`familia`** (é o alias
   que o script usa) → adicionar os e-mails dos testers.
3. Na sua máquina: `npm i -g firebase-tools && firebase login` (mesma conta
   Google do projeto).

### 4. Distribuir (cada build)

```bash
cd apps/mobile
npm run distribute                      # notas = última msg de commit
npm run distribute -- --notes "texto"   # notas customizadas
```

O script (`scripts/distribute.mjs`) roda `gradlew assembleRelease` (avisa se o
keystore de release não estiver configurado) e sobe o APK pro grupo `familia`.
Cada tester recebe e-mail → aceita o convite → baixa e instala o APK (o Android
pede permissão pra "instalar apps desconhecidos" na primeira vez — normal).

> Atualizações instalam por cima enquanto a **assinatura for a mesma** (por isso
> o keystore no passo 1). Subir o `BEBECARE_VERSION_CODE` não é obrigatório pro
> App Distribution, mas ajuda a identificar builds.

---

## Play Store — ⏸️ ADIADO

Quando decidirmos publicar: [PLAY_STORE.md](PLAY_STORE.md) tem a ficha pronta,
e as seções abaixo (CI de release + passos da Play) valem como estavam.

### Workflow de build (`.github/workflows/mobile-release.yml`) — futuro

Manual (`workflow_dispatch`) + por tag `mobile-v*`. Gated nos secrets — não roda
sozinho, então não vira ruído nem check obrigatório:

```yaml
name: Mobile Release (AAB)
on:
  workflow_dispatch:
  push:
    tags: ['mobile-v*']
jobs:
  build-aab:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: apps/mobile } }
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: '22', cache: npm, cache-dependency-path: apps/mobile/package-lock.json }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '17' }
      - run: npm ci
      # Secrets do repo (Settings → Secrets and variables → Actions):
      - run: echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > android/app/bebecare-upload.keystore
        env: { ANDROID_KEYSTORE_BASE64: '${{ secrets.ANDROID_KEYSTORE_BASE64 }}' }
      - run: echo "$GOOGLE_SERVICES_JSON" > android/app/google-services.json
        env: { GOOGLE_SERVICES_JSON: '${{ secrets.GOOGLE_SERVICES_JSON }}' }
      - run: ./gradlew bundleRelease
        working-directory: apps/mobile/android
        # Prefixo ORG_GRADLE_PROJECT_ → o Gradle expõe cada um como project
        # property (ex.: BEBECARE_UPLOAD_STORE_FILE). É isso que o build.gradle lê.
        env:
          ORG_GRADLE_PROJECT_BEBECARE_UPLOAD_STORE_FILE: bebecare-upload.keystore
          ORG_GRADLE_PROJECT_BEBECARE_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ORG_GRADLE_PROJECT_BEBECARE_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ORG_GRADLE_PROJECT_BEBECARE_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          ORG_GRADLE_PROJECT_BEBECARE_VERSION_CODE: ${{ github.run_number }}
      - uses: actions/upload-artifact@v4
        with: { name: bebecare-aab, path: apps/mobile/android/app/build/outputs/bundle/release/*.aab }
```

Secrets necessários: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 bebecare-upload.keystore`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`,
`GOOGLE_SERVICES_JSON`.

> Sobre os nomes: **secrets do GitHub** = `ANDROID_*`; **props do Gradle** que o
> `build.gradle` lê = `BEBECARE_UPLOAD_*`. O workflow faz a ponte: injeta como
> env `ORG_GRADLE_PROJECT_BEBECARE_UPLOAD_*` (esse prefixo é o que vira property
> no Gradle). São espaços de nome distintos de propósito — não precisam coincidir.

### versionCode dinâmico — ✅ JÁ APLICADO

O `build.gradle` já lê `versionCode` da prop `BEBECARE_VERSION_CODE` (fallback 1).
No CI futuro, `ORG_GRADLE_PROJECT_BEBECARE_VERSION_CODE=${{ github.run_number }}`
dá `versionCode` crescente (a Play exige); local, a prop no gradle.properties.

### Passos da Play (quando for a hora)

Conta Developer (US$ 25) → criar app → **Data Safety** (checklist no
[PROGRESS.md](PROGRESS.md)) → ficha (descrição, categoria Saúde, screenshots,
ícone, feature graphic) → subir o AAB na faixa **interna** → testar → promover
pra fechada → produção. URL de privacidade:
`https://mguibtech.github.io/bebecare/privacidade.html`.

---

## Checklist de go-live (Railway + App Distribution)

- [ ] Projeto no Railway: repo conectado, root `apps/api`, Postgres criado
- [ ] Env vars da API (references do Postgres + `JWT_SECRET` + `FIREBASE_*`)
- [ ] Deploy verde: logs do pre-deploy mostram migrations + `GET /api/health` OK no domínio gerado
- [ ] 🔐 Chave antiga do Firebase revogada; service account nova nas vars
- [ ] `API_BASE_URL_PROD` (em `env.ts`) apontando pro domínio do Railway (com `/api`)
- [ ] Keystore gerado + props `BEBECARE_UPLOAD_*` no `%USERPROFILE%\.gradle\gradle.properties`
- [ ] App Distribution ativado + grupo `familia` com os testers
- [ ] `firebase-tools` instalado + `firebase login` feito
- [ ] `npm run distribute` → e-mail chegou nos testers e o app conecta na API
