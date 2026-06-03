# 📌 Onde paramos — BebeCare V1

> Snapshot de progresso. Última sessão: **3 de junho de 2026**.
> (Documento de trabalho interno — fica na raiz, fora de `/docs` que é público via GitHub Pages.)

## TL;DR

**As 11 features de produto da V1 estão TODAS implementadas e mergeadas na `main`.** 🎉
O que falta pra publicar **não é mais código de feature** — é infra de produção, conta/ficha da Play Store, alguns assets e housekeeping.

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
| 9 | Modo Soninho (ruído branco, track-player, timer, fade) | B10 — **falta áudio** |
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

## ▶️ Sugestão de próximo passo (amanhã)
Começar a **Fase C (infra)**: provisionar **Neon** (Postgres) + **Render** (API), rodar migrations em produção, configurar Firebase de produção. Em paralelo: criar conta Play Developer e buscar os áudios do Soninho.
