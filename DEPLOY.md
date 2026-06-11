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
  API NestJS  ──────►  Postgres gerenciado (Neon)
  (Render Web Service)
        │
        └──►  Firebase Admin (FCM push)
```

- **API:** Render (Web Service) — Node, build do Nest, `start:prod`.
- **Banco:** Neon (Postgres serverless, free tier serve pra V1).
- **Push:** Firebase Admin SDK (service account de produção).
- **Mobile:** APK/AAB assinado → Google Play (faixa interna → fechada → produção).

---

## Pré-requisitos (contas)

| Serviço | Pra quê | Custo V1 |
|---|---|---|
| [Neon](https://neon.tech) | Postgres gerenciado | Free |
| [Render](https://render.com) | Hospedar a API | Free (dorme após inatividade) ou Starter |
| [Firebase](https://console.firebase.google.com) | Push (FCM) — service account de prod | Free |
| [Google Play Console](https://play.google.com/console) | Publicar o app | US$ 25 (única vez) |

---

## Passo 1 — Banco (Neon)

1. Crie um projeto no Neon → ele gera uma connection string tipo:
   `postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require`
2. A API usa **vars discretas** (não a URL inteira). Quebre a string e guarde:
   - `POSTGRES_HOST` = host do Neon (ex.: `ep-xxx.us-east-2.aws.neon.tech`)
   - `POSTGRES_PORT` = `5432`
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
3. SSL é obrigatório no Neon — o código liga automaticamente quando
   `NODE_ENV=production` (ou `POSTGRES_SSL=true`). Nada a fazer aqui.
   > Nota de segurança: a conexão usa `ssl: { rejectUnauthorized: false }` —
   > criptografa o tráfego (TLS) mas não valida o certificado/hostname do
   > servidor. Aceitável entre Render↔Neon (rede gerenciada). Hardening futuro:
   > passar o CA bundle do Neon com `rejectUnauthorized: true`.

## Passo 2 — API (Render)

> ⚡ **Atalho:** o repo tem um **`render.yaml`** (blueprint) na raiz. No Render:
> **New → Blueprint → conecte o repo**. Ele já cria o Web Service com
> build/start/health/migrations e pede só os segredos (`POSTGRES_*`, `FIREBASE_*`).
> Aí pode pular os detalhes manuais abaixo (que ficam como referência).

Configuração manual (equivalente ao blueprint) — **Web Service**, root `apps/api`:

- **Build Command:** `npm ci && npm run build`
- **Start Command:** `npm run start:prod`  ⚠️ **não** use `npm start` (tem
  `prestart` que sobe docker — quebra no Render).
- **Health Check Path:** `/api/health`  (já retorna 503 se o banco cair).
- **Environment** (env vars):

```
NODE_ENV=production
# Render injeta PORT sozinho — o main.ts já lê process.env.PORT.
POSTGRES_HOST=...        # do Neon
POSTGRES_PORT=5432
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
# POSTGRES_SSL não precisa: NODE_ENV=production já liga TLS.
JWT_SECRET=...           # gere: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FIREBASE_PROJECT_ID=...      # ver Passo 3
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

> A API sobe sem as 3 vars do Firebase (push entra em modo "desabilitado",
> loga avisos). Configure-as quando o push de produção for necessário.

## Passo 3 — Firebase (service account de produção)

1. Console do Firebase → **Configurações do projeto → Contas de serviço**.
2. **Gerar nova chave privada** → baixa um JSON.
3. Copie 3 campos do JSON pras env vars do Render:
   - `project_id`   → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key`  → `FIREBASE_PRIVATE_KEY` (mantenha os `\n` literais; no
     Render cole o valor com as quebras escapadas como `\n`).

## Passo 4 — Migrations em produção

As tabelas + o seed do PNI vêm das migrations (não há `synchronize`).

- Rode **uma vez** (e a cada deploy com migration nova), com as env vars do
  Neon apontadas e SSL ligado:

```bash
cd apps/api
POSTGRES_SSL=true POSTGRES_HOST=... POSTGRES_USER=... POSTGRES_PASSWORD=... \
POSTGRES_DB=... npm run migration:run
```

- No Render, já vem no `render.yaml` como **`preDeployCommand`** (roda sozinho
  antes de cada deploy ir ao ar). Se configurar manual, use o **Pre-Deploy
  Command**: `npm run migration:run`.
  ⚠️ `migration:run` roda via **ts-node** (está em `devDependencies`), então
  precisa que as devDeps estejam presentes — o Pre-Deploy do Render roda **antes**
  do prune de devDeps, então funciona. Se der `ts-node not found`, é porque
  rodou após o prune: rode as migrations num passo que ainda tenha as devDeps.
- `migration:run` usa `src/database/data-source.ts` (já com SSL condicional).

## Passo 5 — 🔐 Segurança (fazer agora)

- **Rotacionar a chave do Firebase** que apareceu no chat: gere uma nova
  (Passo 3), atualize o `apps/api/.env` local + as vars do Render, e **apague
  a antiga** no Google Cloud → IAM → Contas de serviço.
- O `apps/api/.env` **não está versionado** (confirmado: coberto pelo
  `.gitignore`). Mantenha assim — segredos só em `.env` local e nos painéis.

---

## ✅ Já pronto no código (não precisa fazer nada)

| Item | Onde |
|---|---|
| Porta dinâmica (`process.env.PORT`) + bind `0.0.0.0` | `apps/api/src/main.ts` |
| SSL no Postgres em prod | `database.config.ts` + `data-source.ts` |
| Healthcheck `GET /api/health` (503 se DB cair) | `apps/api/src/health/` |
| Cron de limpeza de convites (diário 3h) | `families/jobs/family-invites-cleanup.job.ts` |
| Lembrete de consulta (cron 5 min, FCM) | `appointments/jobs/appointments-reminder.job.ts` |
| i18n pt/en (mobile + catálogo de vacinas via `Accept-Language`) | toda a stack |
| CI de lint/types/testes (API + mobile) | `.github/workflows/*-ci.yml` |

---

## Mobile — release Android assinado

> Isto depende de um **keystore** que só você gera (segredo). O código de build
> nativo **não foi alterado** neste PR — aplique os blocos abaixo quando for
> gerar o keystore, e teste `npm run android` localmente depois.

### 0. Apontar o app pra API de produção ⚠️

O `apps/mobile/src/shared/config/env.ts` agora escolhe a URL por build:
release (`__DEV__ === false`) usa `API_BASE_URL_PROD`; dev usa `localhost`.
**Antes do release**, troque o placeholder `API_BASE_URL_PROD` pela URL real do
Render (ex.: `https://bebecare-api.onrender.com/api`). Sem isso o app de
produção aponta pro placeholder e não conecta.

### 1. Gerar o upload keystore (uma vez)

```bash
keytool -genkeypair -v -keystore bebecare-upload.keystore \
  -alias bebecare -keyalg RSA -keysize 2048 -validity 10000
```
Guarde o arquivo + as senhas num cofre. **Perder o keystore = não conseguir
atualizar o app na Play.**

### 2. Adicionar o signing de release em `apps/mobile/android/app/build.gradle`

Hoje o release usa o `signingConfigs.debug` (linha ~104). Troque por uma config
que lê de `gradle.properties`/env, com fallback pro debug (mantém `npm run
android` funcionando localmente sem o keystore):

```groovy
signingConfigs {
    debug { /* ...como está... */ }
    release {
        if (project.hasProperty('BEBECARE_UPLOAD_STORE_FILE')) {
            storeFile file(BEBECARE_UPLOAD_STORE_FILE)
            storePassword BEBECARE_UPLOAD_STORE_PASSWORD
            keyAlias BEBECARE_UPLOAD_KEY_ALIAS
            keyPassword BEBECARE_UPLOAD_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig project.hasProperty('BEBECARE_UPLOAD_STORE_FILE')
            ? signingConfigs.release : signingConfigs.debug
        // ...resto como está...
    }
}
```

### 3. Workflow de build (`.github/workflows/mobile-release.yml`)

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
        env:
          BEBECARE_UPLOAD_STORE_FILE: bebecare-upload.keystore
          BEBECARE_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          BEBECARE_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          BEBECARE_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          ORG_GRADLE_PROJECT_VERSION_CODE: ${{ github.run_number }}
      - uses: actions/upload-artifact@v4
        with: { name: bebecare-aab, path: apps/mobile/android/app/build/outputs/bundle/release/*.aab }
```

Secrets necessários: `ANDROID_KEYSTORE_BASE64` (`base64 -w0 bebecare-upload.keystore`),
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`,
`GOOGLE_SERVICES_JSON`.

> Sobre os nomes: os **secrets do GitHub** usam prefixo `ANDROID_*`; as
> **propriedades do Gradle** (que o `build.gradle` lê) usam `BEBECARE_UPLOAD_*`.
> O workflow faz a ponte (mapeia um no outro nos `env:` do step de build). São
> dois espaços de nome distintos de propósito — não precisam coincidir.

### 4. versionCode dinâmico

Hoje `versionCode 1` está fixo em `build.gradle`. Pro CI, leia de env:
`versionCode (project.hasProperty('VERSION_CODE') ? VERSION_CODE.toInteger() : 1)`
e passe `-PVERSION_CODE=${{ github.run_number }}` (ou via `ORG_GRADLE_PROJECT_*`).

### 5. Play Store

Conta Developer (US$ 25) → criar app → **Data Safety** (checklist no
[PROGRESS.md](PROGRESS.md)) → ficha (descrição, categoria Saúde, screenshots,
ícone, feature graphic) → subir o AAB na faixa **interna** → testar → promover
pra fechada → produção. URL de privacidade:
`https://mguibtech.github.io/bebecare/privacidade.html`.

---

## Checklist de go-live

- [ ] Neon criado + vars discretas anotadas
- [ ] Render Web Service (build/start/health corretos) + env vars
- [ ] `migration:run` rodado contra o Neon (tabelas + seed PNI)
- [ ] Firebase service account de prod nas env vars
- [ ] 🔐 Chave do Firebase antiga rotacionada
- [ ] `API_BASE_URL_PROD` (em `env.ts`) trocado pela URL do Render (release usa via `__DEV__`)
- [ ] Keystore gerado + signing de release aplicado + secrets no GitHub
- [ ] AAB assinado subido na faixa interna da Play
