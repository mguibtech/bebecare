# 📌 Onde paramos — BebeCare V1

> Snapshot de progresso. Última sessão: **11 de junho de 2026**.
> (Documento de trabalho interno — fica na raiz, fora de `/docs` que é público via GitHub Pages.)

## TL;DR

**As 11 features de produto da V1 estão TODAS implementadas e mergeadas na `main`.** 🎉
O que falta pra publicar **não é mais código de feature** — é infra de produção, conta/ficha da Play Store, alguns assets e housekeeping.

A sessão de **11 jun** terminou a **i18n da fatia 3 no mobile**: toda a superfície visível do app agora segue o idioma do sistema (pt/en). Falta só a **i18n do backend** (cluster 4 — decisão de arquitetura pendente) e duas fatias deixadas de fora de propósito (mensagens zod dos forms e snackbars dos mutation hooks). Detalhes abaixo.

---

## 🆕 Sessão 11 jun 2026 — i18n fatia 3 (mobile completo)

Branch **`feat/mobile-i18n-fatia3`** (a partir da `main`, com a fatia2/#61 já mergeada). Tudo validado (`tsc` + `eslint` + 22 testes verdes a cada commit). 6 commits:

1. **Aba Mais + EditProfile + Permissions + headers de nav** — MoreScreen, ModePicker/PalettePicker (claro/escuro/sistema, azul/rosa), PermissionsScreen; e os títulos de header do `AppNavigator` (que estavam fixos em pt mesmo pra telas já migradas na fatia2: Família, Consulta, Remédio…).
2. **Babies** — BabyForm/Detail/Selector + SexPicker/BloodTypePicker/AvatarStylePicker. `SEX_LABELS`/`AVATAR_STYLE_LABELS` viraram i18n (mapa enum→chave local); `BLOOD_TYPE_LABELS` ficou (universal A+/O-).
3. **Modo Soninho** — SleepScreen + sons/timers; `player.ts` usa `i18n.t()` standalone pro título da notificação do track-player (1º uso de `i18n.t` fora do React).
4. **Mapas de domínio** — `DOSE_UNIT_LABELS`→`DOSE_UNIT_KEYS`, `DAY_LABELS`→`DAY_KEYS`; consumidores React (cards, detalhe, pickers, AlarmCard) via `t()` e notifee (scheduler/snooze) via `i18n.t()`. Novos namespaces `days`/`daysPicker`.
5. **Sheets** — ScheduleEditor, RegisterVaccine, VaccineDetail.

**Padrão adotado** (igual fatia2): mapa **enum→chave i18n** local (`const X_KEY = {...} as const` → `t(X_KEY[v])`); formatadores compartilhados recebem `t`/usam `i18n.t`; catálogos `pt`/`en` tipados (chave faltando = erro de build).

**Deixado de fora de propósito (não é regressão — nunca foi migrado):**
- **Mensagens zod dos forms** (baby/medication/appointment/register schemas) — TODAS em pt. Localizar exige schema-factory `(t) => schema`. Fatia à parte.
- **Snackbars dos mutation hooks** (`useCreate*`/`useUpdate*`/etc. — ex. "Consulta agendada") — TODOS em pt em todo o app. Precisa de `i18n.t` standalone. Fatia à parte.
- **Backend** (cluster 4) — ver "Falta na i18n" abaixo.

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

**Falta na i18n (depois da fatia 3 — 11 jun):** só o **backend** (cluster 4) e duas fatias transversais (zod dos forms; snackbars dos hooks). O resto da superfície visível do mobile está migrado.

**i18n no backend (cluster 4) — decisão de arquitetura pendente:**
- `daysOfWeekNames`: o mobile já tem `DAY_KEYS` — dá pra **derivar do `daysOfWeekMask` no cliente** e dispensar o campo do servidor (sem `Accept-Language`). *Recomendado.*
- `doseLabel`: variantes ricas (`'Dose inicial'`, `'2ª dose (com varicela)'`, `'1º/2º reforço'`) vêm do **seed do banco** (migration PNI) — não dá pra derivar só de `doseNumber`/`isBooster`.
- **Nomes + descrições das vacinas**: ~30 entradas seedadas em pt. Localizar exige **tabela de traduções** OU **catálogo no código** (com inglês médico preciso) + `Accept-Language` no servidor e header enviado pelo mobile.

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

### Fase E — i18n ✅ fatia 3 mobile FEITA (11 jun, branch `feat/mobile-i18n-fatia3`)
Toda a superfície visível do mobile segue o idioma do sistema. Resta:
1. **Backend (cluster 4)** — decisão de arquitetura pendente (ver "i18n no backend" acima). Provável melhor caminho: derivar `daysOfWeekNames` no cliente + decidir tabela-de-traduções vs catálogo-no-código pras vacinas. Deve virar **PR próprio** (mexe no contrato da API).
2. **Mensagens zod dos forms** — schema-factory `(t) => schema`. Fatia transversal.
3. **Snackbars dos mutation hooks** — via `i18n.t` standalone. Fatia transversal.

### Fase C — Infra de produção (NÃO iniciada) — *gate pra publicar*
1. Postgres gerenciado (**Neon**) + rodar migrations em produção.
2. Hospedar a API (**Render**) + env vars de produção.
3. Firebase: service account de produção (e **rotacionar a chave** exposta — ver Housekeeping).
4. Cron de healthcheck (`/api/health`) + limpeza de convites.
5. CI/CD do mobile (build APK/AAB).

### Fase D — Play Store
1. Conta Google Play Developer (US$ 25).
2. **Data Safety form** (checklist pronto acima).
3. Ficha do app (descrição, categoria Saúde, screenshots, ícone, feature graphic).
4. Release assinado (keystore, versionCode=1, internal → closed → production).

### Assets / polimento (paralelo, sem bloquear)
- **8 áudios do Modo Soninho** (`.ogg` CC0) — ver `apps/mobile/assets/audio/CREDITS.md`.
- Polimento de UX/identidade apontado no `DESIGN_REVIEW.md` (densidade da Home, IA Início×Hoje, avatar off-brand).

> **Recomendação:** fechar a **Fase E (i18n fatia 3)** rápido enquanto o contexto está fresco, depois atacar a **Fase C (infra)** que é o gate real pra publicar. Áudios e conta Play podem correr em paralelo.
