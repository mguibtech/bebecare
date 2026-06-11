# 📌 Onde paramos — BebeCare V1

> Snapshot de progresso. Última sessão: **11 de junho de 2026**.
> (Documento de trabalho interno — fica na raiz, fora de `/docs` que é público via GitHub Pages.)

## TL;DR

**As 11 features de produto da V1 estão TODAS implementadas e mergeadas na `main`.** 🎉
O que falta pra publicar **não é mais código de feature** — é infra de produção, conta/ficha da Play Store, alguns assets e housekeeping.

A sessão de **11 jun** **fechou a i18n por completo**: mobile (fatia 3 + closeout E1/E2/E3) **e** backend (cluster 4 — catálogo de vacinas via `Accept-Language`). O app está 100% bilíngue (pt/en, seguindo o idioma do sistema). Detalhes abaixo.

---

## 🆕 Sessão 11 jun 2026 — i18n fatia 3 (mobile completo)

Branch **`feat/mobile-i18n-fatia3`** (a partir da `main`, com a fatia2/#61 já mergeada). Tudo validado (`tsc` + `eslint` + 22 testes verdes a cada commit). 6 commits:

1. **Aba Mais + EditProfile + Permissions + headers de nav** — MoreScreen, ModePicker/PalettePicker (claro/escuro/sistema, azul/rosa), PermissionsScreen; e os títulos de header do `AppNavigator` (que estavam fixos em pt mesmo pra telas já migradas na fatia2: Família, Consulta, Remédio…).
2. **Babies** — BabyForm/Detail/Selector + SexPicker/BloodTypePicker/AvatarStylePicker. `SEX_LABELS`/`AVATAR_STYLE_LABELS` viraram i18n (mapa enum→chave local); `BLOOD_TYPE_LABELS` ficou (universal A+/O-).
3. **Modo Soninho** — SleepScreen + sons/timers; `player.ts` usa `i18n.t()` standalone pro título da notificação do track-player (1º uso de `i18n.t` fora do React).
4. **Mapas de domínio** — `DOSE_UNIT_LABELS`→`DOSE_UNIT_KEYS`, `DAY_LABELS`→`DAY_KEYS`; consumidores React (cards, detalhe, pickers, AlarmCard) via `t()` e notifee (scheduler/snooze) via `i18n.t()`. Novos namespaces `days`/`daysPicker`.
5. **Sheets** — ScheduleEditor, RegisterVaccine, VaccineDetail.

**Padrão adotado** (igual fatia2): mapa **enum→chave i18n** local (`const X_KEY = {...} as const` → `t(X_KEY[v])`); formatadores compartilhados recebem `t`/usam `i18n.t`; catálogos `pt`/`en` tipados (chave faltando = erro de build).

**Fechado no closeout (`feat/mobile-i18n-closeout`):** dias da semana derivados no cliente (E1), mensagens zod via schema-factory (E2) e snackbars dos hooks via `i18n.t` (E3). E o **backend** (cluster 4, `feat/api-i18n-vaccines`) fechou a última ponta — ver "i18n" abaixo.

---

## 🆕 Sessão 4 jun 2026 — hardening + i18n

Tudo validado (`tsc` + `eslint` + 22 testes verdes em cada commit) e verificado no device físico (Android 13).

**Mergeado na `main`:**
- **track-player roda na New Architecture** (RN 0.85 bridgeless) — era um crash que derrubava o app no Modo Soninho: o `MusicService` nativo emitia eventos via `ReactNativeHost` (proibido no bridgeless). Fix via patch-package usando o getter `reactContext` (ReactHost). **PR #57.** Verificado: app sobe sem crash. Ver [[bebecare-trackplayer-newarch]].
- **Resiliência de rede + perfil** — `focusManager`+`AppState` no React Query (queries com erro se recuperam ao voltar pro foreground); botão "Tentar de novo" na aba Mais (antes travava só com "Sair"); a Home não inventa mais o nome "voce". **PR #60.**
- **Varredura de acentos PT-BR** (~145 arquivos) — strings estavam inconsistentes (voce/bebe/familia/proxima). **PR #60.**
- **Atalhos rápidos na Home** — Consulta/Remédio/Soninho/Despertar (expõe Soninho e Despertadores, antes só acessíveis em "Mais"). **PR #60.**
- **Primeiros testes de unidade** (22; antes só 1 smoke) — recorrência de alarmes, agrupamento de vacinas por idade, normalização de erro da API (`extractErrorMessage`). **PR #60.**
- **API sobe o Postgres sozinha** — `prestart`/`prestart:dev` → `docker compose up -d postgres`. **PR #58.**
- **Backend dev acessível em device físico** — `localhost` + `npm run adb` (reverse de 8081/3000/9090). **PR #57.**

**i18n — o app segue o idioma do sistema (pt/en):**
- Fundação: `i18next` + `react-i18next`, detecção do locale via `Intl` do Hermes (**sem dependência nativa**, fallback pt), catálogos `pt`/`en` **tipados** (chave faltando = erro de build) com pluralização e datas localizadas. **PR #60.**
- Migrado e seguindo o idioma: **abas, Início, Hoje, Vacinas, Saúde/Consultas, Remédios, Família, Alarmes, Onboarding, Login/Cadastro.** (PR #60 + **PR `feat/mobile-i18n-fatia2`** — Consultas/Remédios/Família/Alarmes/Onboarding/Auth).
- Verificado no device (per-app locale `en-US`): a superfície migrada vira inglês com plural e datas corretos; revertido pro sistema depois.

**i18n: ✅ 100% completa (mobile + backend).** Nada pendente.

**Backend (cluster 4) — FEITO (11 jun, branch `feat/api-i18n-vaccines`):** `@Lang()` lê `Accept-Language` → `pt|en` (sem dependência nova); catálogo de traduções `en` das 26 vacinas PNI por `code` (nome/descrição/doseLabel, fallback pt); `VaccinesService` (catálogo + schedule) e `VaccineRecordsController` localizam o conteúdo. Mobile envia `Accept-Language = systemLanguage()` em todo request. `daysOfWeekNames` saiu de cena no E1 (derivado no cliente).

**Achado documentado:** o **lembrete de consulta JÁ funciona** — cron no backend (`AppointmentsReminderJob`, a cada 5 min) envia push FCM no offset configurado (default **24h antes**), idempotente via coluna `notified_at`. Depende de backend no ar + token FCM + permissão.

---

## ✅ Features da V1 — todas prontas (na `main`)

| # | Feature | Onde |
|---|---|---|
| 1–4 | Auth (JWT), avatar DiceBear, convite de casal, cadastro do bebê | backend + mobile |
| 5 | Vacinas PNI (calendário + checklist) | M4 |
| 6 | Consultas pediátricas | M5 |
| 7 | Remédios + **alarme local eficaz** (notifee, full-screen, exact alarm) | M6/B8 — **testado no device, tocou** |
| 7+ | Deep-link ao tocar alarme (6D) + snooze | M6 follow-up |
| 8 | Despertador da mamada (mamada/troca/soneca) + **modo intervalo (a cada 2/3/4/6h)** | M7 |
| 9 | Modo Soninho (ruído branco, track-player, timer, fade) | B10 — track-player **roda na New Arch** (fix 4 jun); **falta só o áudio** |
| 10 | Tela "Hoje" (doses do dia) | M6/6C |
| 11 | Configurações (editar perfil, permissões, sobre) | B11 |
| — | Push/FCM (Firebase configurado) | M6/6A |
| — | Política de Privacidade + Termos (GitHub Pages, **no ar**) | D2 |

**Backend (NestJS):** módulos auth, users, families, babies, vaccines, appointments, medications, **alarms** (despertador, M7), notifications. Migrations aplicadas no DB de dev.

---

## ⬜ O que falta pra PUBLICAR (não é feature)

### Assets / conteúdo
- [ ] **8 áudios do Modo Soninho** (`.ogg` CC0) → `apps/mobile/android/app/src/main/res/raw/`
      Instruções e nomes exatos em `apps/mobile/assets/audio/CREDITS.md`.
      Fontes: Pixabay / Freesound (CC0). Branco/marrom dá pra gerar no Audacity.
      (App compila e a tela funciona sem eles; só não sai som.)

### Fase C — Infra de produção (NÃO iniciada)
- [ ] Banco Postgres gerenciado (recomendação: **Neon**) + rodar migrations
- [ ] Hospedar a API (recomendação: **Render**) + env vars de produção
- [ ] Firebase: service account de produção
- [ ] Healthcheck cron (`/api/health`) e cron de limpeza de convites
- [ ] CI/CD do mobile (build APK/AAB)

### Fase D — Play Store
- [ ] Conta Google Play Developer (US$ 25)
- [ ] **Data Safety form** — checklist pronto (ver abaixo)
- [ ] Ficha do app (descrição, categoria Saúde, screenshots, ícone, feature graphic)
- [ ] URL de privacidade na ficha: `https://mguibtech.github.io/bebecare/privacidade.html`
- [ ] Release: keystore assinado, versionCode=1, faixas internal → closed → production

### 🔐 Housekeeping / segurança
- [ ] **Rotacionar a chave do Firebase** (a service account `db8e4b1a84…` apareceu no chat — gerar nova em Configurações → Contas de serviço, atualizar `apps/api/.env`, apagar a antiga no Google Cloud)
- [ ] Remover `C:\Users\SOFT LIVE\.git` (repo git acidental na HOME — faz a IDE mostrar arquivos do Android SDK)

---

## 📋 Data Safety (Play Console) — checklist pronto

**Gerais:** coleta dados = **Sim** · criptografado em trânsito = **Sim** · permite exclusão = **Sim** (Mais → Excluir conta) · compartilha com terceiros = **Não**.

**Tipos (todos: Coletados, NÃO compartilhados, finalidade Funcionalidade do app):**
- Informações pessoais → Nome, E-mail, Outras (dados do bebê: nome/sexo/nascimento)
- Saúde e fitness → Informações de saúde (vacinas, remédios, consultas)
- IDs de dispositivo → token FCM

Público-alvo **18+** (não é app "para crianças" → fora do programa Families).

---

## 🛠 Notas pra retomar (ambiente)

- **Monorepo:** `apps/api` (NestJS) + `apps/mobile` (React Native CLI). Usa **npm** (não yarn — `yarn.lock` é gitignored).
- **Pins críticos no mobile:** `react` = **19.2.3** (exato, ditado pelo RN), `jest` = **29.7.0** (preset RN 0.85). Dependabot já ignora majors (`dependabot.yml`).
- **Validar antes de PR:** `cd apps/mobile && npx tsc --noEmit -p tsconfig.json && npx eslint . && npx jest` · API: `cd apps/api && npm run build && npx jest`.
- **`main` é protegida:** exige PR + 2 checks de CI ("Lint + Tests Node 20/22") verdes.
- **Firebase:** `google-services.json` (mobile) e `.env` (api) configurados localmente, gitignored. App roda sem eles (no-op).
- **Alarmes:** notifee + track-player são **módulos nativos** → mudança neles exige `npm run android` (rebuild), não só reload do Metro.

## ▶️ Próximas fases (ordem sugerida)

### Fase E — i18n: ✅ COMPLETA (mobile + backend)
App 100% bilíngue (pt/en, segue o idioma do sistema). Histórico:
- **fatia3 #61 + closeout** (`feat/mobile-i18n-closeout`): toda a UI do mobile, incl. E1 (dias derivados no cliente), E2 (zod via schema-factory `validation.*`), E3 (snackbars via `i18n.t`, `feedback.*`).
- **cluster 4** (`feat/api-i18n-vaccines`): backend localiza o catálogo de vacinas via `Accept-Language` (`@Lang()` + catálogo `en` por `code`); mobile envia o header.

Nada pendente na i18n. Próxima fatia transversal (se um dia precisar): localizar texto de **push/FCM** e e-mails — hoje não há e-mail e o push usa conteúdo do servidor.

### Fase C — Infra de produção — *gate pra publicar* (prep FEITA; falta provisionar contas)
**Runbook completo em [DEPLOY.md](DEPLOY.md).** A prep de código (branch `chore/prod-infra-prep`) já cobriu o que dava sem as contas:
- ✅ **prod-readiness:** `main.ts` lê `process.env.PORT` + bind `0.0.0.0` (Render); SSL condicional no Postgres em prod (`database.config.ts` + `data-source.ts`, p/ Neon); `/api/health` retorna **503** quando o banco cai (readiness probe).
- ✅ **Crons já existiam:** limpeza de convites (diário 3h) + lembrete de consulta (5 min).
- ✅ **CI do mobile** (`mobile-ci.yml`): lint + tsc + jest — antes o mobile só rodava local (gap fechado). *(Se quiser torná-lo required no ruleset, tirar o filtro de paths do `pull_request` — ver comentário no arquivo.)*
- ✅ `.env.example` ganhou `POSTGRES_SSL`.

**Falta (suas ações nos painéis — passo a passo no DEPLOY.md):**
1. **Neon** (Postgres) + rodar `migration:run` apontando pro Neon.
2. **Render** (Web Service): build `npm ci && npm run build`, start `npm run start:prod`, health `/api/health`, env vars de prod.
3. **Firebase** service account de prod (3 env vars) + **rotacionar a chave exposta**.
4. **Mobile release:** gerar keystore + aplicar o `signingConfigs.release` no `build.gradle` + workflow `mobile-release.yml` + secrets (tudo documentado no DEPLOY.md — não comitado porque depende do keystore).

### Fase D — Play Store
**Ficha pronta pra colar em [PLAY_STORE.md](PLAY_STORE.md)** (título, descrições pt-BR, Data Safety consolidado, classificação 18+, specs de assets, release notes, checklist).
1. Conta Google Play Developer (US$ 25).
2. **Data Safety form** + classificação IARC (respostas no PLAY_STORE.md).
3. Ficha do app (copy pronto no PLAY_STORE.md) + assets: ícone 512, feature graphic 1024×500, ≥2 screenshots (ficam melhores após o polimento do DESIGN_REVIEW).
4. Release assinado (keystore + signing — ver DEPLOY.md; `versionCode` dinâmico via CI; internal → closed → production).

### Assets / polimento (paralelo, sem bloquear)
- **8 áudios do Modo Soninho** (`.ogg` CC0) — ver `apps/mobile/assets/audio/CREDITS.md`.
- Polimento de UX/identidade apontado no `DESIGN_REVIEW.md` (densidade da Home, IA Início×Hoje, avatar off-brand).

> **Estado (11 jun):** i18n 100% (Fase E) ✅ e prep de infra (Fase C) ✅ feitos. O que resta pra publicar é **operacional/suas contas**: seguir o [DEPLOY.md](DEPLOY.md) (Neon → Render → Firebase prod → keystore/Play). Áudios do Soninho e conta Play podem correr em paralelo.
