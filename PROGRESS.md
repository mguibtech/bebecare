# 📌 Onde paramos — BebeCare V1

> Snapshot de progresso. Última sessão: **4 de junho de 2026**.
> (Documento de trabalho interno — fica na raiz, fora de `/docs` que é público via GitHub Pages.)

## TL;DR

**As 11 features de produto da V1 estão TODAS implementadas e mergeadas na `main`.** 🎉
O que falta pra publicar **não é mais código de feature** — é infra de produção, conta/ficha da Play Store, alguns assets e housekeeping.

A sessão de **4 jun** foi de **qualidade/robustez + internacionalização** (sem features novas): resolveu o crash do track-player na New Architecture, endureceu a resiliência de rede, corrigiu acentos, adicionou os primeiros testes e fez o app **seguir o idioma do sistema (pt/en)**. Detalhes na seção abaixo.

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

**Falta na i18n (fatia 3):** resto da aba Mais (Aparência/Permissões/Excluir conta/"Em breve"), EditProfile, Permissions, BabyForm/Detail, SleepScreen, sheets (ScheduleEditor/RegisterVaccine/VaccineDetail), pickers (DaysOfWeek/DoseUnit); mapas de domínio (`DOSE_UNIT_LABELS`, `DAY_LABELS`); e **i18n no backend** (`doseLabel`, nomes de vacinas, `daysOfWeekNames` — exigem `Accept-Language` no servidor).

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

### Fase E — i18n fatia 3 (curto prazo, baixo risco)
Terminar a internacionalização (a infra já está pronta; é só seguir o padrão `t('namespace.key')` + catálogos pt/en):
1. Resto da aba **Mais** (Aparência, Permissões, Excluir conta, "Em breve"), **EditProfile**, **Permissions**.
2. **BabyForm/Detail**, **SleepScreen**, sheets (ScheduleEditor/RegisterVaccine/VaccineDetail), pickers (DaysOfWeek/DoseUnit).
3. Mapas de domínio: `DOSE_UNIT_LABELS`, `DAY_LABELS`.
4. **i18n no backend** (`Accept-Language`) pra traduzir `doseLabel`, nomes de vacinas e `daysOfWeekNames` — hoje vêm fixos em pt.

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
