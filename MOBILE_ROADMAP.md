# Mobile — Roadmap de implementação

Plano detalhado, fase por fase, do mobile React Native até o release.
Documento vivo: atualizar conforme cada M fechar.

> Arquitetura, padrões e justificativas estão em [ARCHITECTURE.md](./ARCHITECTURE.md).
> Este doc foca em **o que entregar, em que ordem, com que critério de aceite**.

---

## Estado atual (2026-05-26)

| Marco | Status | Branch | PR |
|-------|--------|--------|----|
| **M0** — RN CLI bare + Welcome rodando | Done | `feat/mobile-init` → main | #15 (em review, aguardando CI) |
| **M1** — Estrutura `src/` + deps + providers | Done | `feat/mobile-m1-setup` → main | #16 (abrir após #15 mergear) |
| **M2** — Auth real | Próximo | `feat/mobile-m2-auth` (a criar) | — |

**Backend status:** 48 endpoints prontos em `apps/api/src/modules/`, cobrindo
auth, users, families, babies, vaccines (catálogo PNI + records), appointments,
medications (med + schedules + dose logs), notifications (push via FCM stubbed).
Falta criar 3 módulos: prescriptions (M7), shopping (M8), diary (M9).

**Stack mobile (fixada):** Paper-only para UI; Navigation 7 native-stack +
bottom-tabs; React Query 5 para server-state; Zustand para client-state;
react-hook-form + zod para forms; axios + Keychain + MMKV; FCM para push.

---

## Convenções de cada M

Cada M segue o mesmo padrão:

1. **Branch:** `feat/mobile-m<n>-<slug>` (ex: `feat/mobile-m2-auth`).
2. **PRs:** quebrar em 2–3 PRs lógicos quando possível (API layer → telas → polish).
3. **Critério de aceite:** lista checkable no fim da seção do M.
4. **Definition of Done:** lint passa, jest passa, app builda no Android,
   feature funciona end-to-end contra backend rodando local (`docker-compose up`).

---

## M2 — Auth real (estimativa: 4–5 dias)

### Objetivo
Substituir o login placeholder por fluxo real contra `/auth/*`. Token persiste
em Keychain entre restarts, refresh transparente em background, logout limpa
tudo.

### Endpoints consumidos
- `POST /auth/register` (público)
- `POST /auth/login` (público)
- `POST /auth/refresh` (público)
- `POST /auth/logout` (protegido)
- `GET /auth/me` (protegido)

### Trabalho

**PR 2A — Auth API + hooks**
- [ ] `features/auth/api/auth.api.ts` — 5 funções: login, register, refresh, logout, fetchMe
- [ ] `features/auth/schemas/auth.schema.ts` — zod schemas (login, register)
- [ ] `features/auth/hooks/useLogin.ts`, `useRegister.ts`, `useMe.ts`, `useLogout.ts`
- [ ] `features/auth/types.ts` — `AuthResponse`, `MeResponse`
- [ ] Refresh strategy no `shared/api/client.ts`:
  - Interceptor 401 → tenta refresh com refreshToken do Zustand
  - Sucesso: salva novo par no Keychain, retry request original
  - Falha: signOut
  - Promise singleton pra evitar refresh paralelo

**PR 2B — Telas + navegação**
- [ ] `features/auth/screens/LoginScreen.tsx` (substituir placeholder)
- [ ] `features/auth/screens/RegisterScreen.tsx`
- [ ] AuthNavigator com Login e Register
- [ ] `shared/components/FormTextInput.tsx` — wrapper Paper TextInput + Controller
- [ ] `shared/components/SubmitButton.tsx` — Paper Button com loading
- [ ] HomeScreen real: mostra `useMe()` (nome do usuário), botão "Sair"
- [ ] AppNavigator com Drawer ou Tab vazio (placeholder pras próximas features)

**PR 2C — Testes**
- [ ] Mocks com MSW (`msw` + `msw/native` ou usar `@mswjs/data`)
- [ ] Testes hooks: useLogin sucesso, useLogin 401, useMe cacheado
- [ ] Smoke test LoginScreen renderiza
- [ ] Snapshot de erro de validação zod

### Critério de aceite
- [ ] Registro novo → cria conta → loga automático → vai pra Home
- [ ] Login com credenciais válidas → vai pra Home
- [ ] Login com credenciais ruins → mostra erro no form
- [ ] Refresh do app (kill + reopen) → continua logado se token válido
- [ ] Após access token expirar (15min), próxima request renova transparente
- [ ] Botão "Sair" → limpa Keychain + clearQueries + volta pra Login
- [ ] 401 em endpoint protegido → desloga automaticamente

### Anotações de implementação
- Refresh com fila: usar `axios-auth-refresh` OU manual com Promise singleton.
  Manual é mais código mas zero deps externas — preferir manual.
- `qc.clear()` no signOut: limpa todo cache do React Query.
- Mensagens de erro em PT-BR direto no zod schema (`z.string().email('Email inválido')`).

---

## M3 — Família + Bebê (estimativa: 4 dias)

### Objetivo
Usuário cria perfil do bebê e pode convidar par (cônjuge) pra compartilhar
acesso. Bebê selecionado fica em Zustand para usar como contexto nas próximas
features.

### Endpoints
- `GET/PATCH /families/me`, `POST /families/me/invites`, etc (7 endpoints)
- `GET/POST/GET/PATCH/DELETE /babies` (5 endpoints)

### Trabalho

**PR 3A — Bebê CRUD**
- [ ] `features/babies/api/babies.api.ts` (5 funções)
- [ ] `features/babies/hooks/` (useBabies, useBaby, useCreateBaby, useUpdateBaby, useDeleteBaby)
- [ ] `features/babies/schemas/baby.schema.ts`
- [ ] `features/babies/store/baby-selector.store.ts` — Zustand com `selectedBabyId`
- [ ] Telas: BabiesListScreen, BabyFormScreen (create + edit), BabyDetailScreen
- [ ] Seletor de bebê no topo da Home (Avatar/Chip clicável)

**PR 3B — Família + convite**
- [ ] `features/family/api/family.api.ts`
- [ ] `features/family/hooks/`
- [ ] Tela: FamilyScreen com membros + lista de convites pendentes
- [ ] Tela: CreateInviteScreen → gera token + Share API nativa do RN
- [ ] Tela: AcceptInviteScreen (deep link `bebecare://invite/:token`)
- [ ] Setup do `linking` no NavigationContainer

### Critério de aceite
- [ ] Criar bebê com nome, data nascimento, sexo, blood type, foto
- [ ] Editar bebê
- [ ] Excluir bebê (com confirmação Paper Dialog)
- [ ] Selecionar bebê ativo persiste em MMKV
- [ ] Criar convite → recebe link → compartilhar via Share nativo
- [ ] Abrir link em outro device → aceita convite → entra na família

### Anotações
- `baby-selector.store.ts` deve hidratar do MMKV no boot junto com o auth.store.
- Quando deletar bebê selecionado, limpar a seleção.
- Validar idade do bebê: se nasceu hoje, mostra "0 dias"; usar `date-fns` `formatDistance`.

---

## M4 — Vacinas (PNI) (estimativa: 6–7 dias)

### Objetivo
Mostrar o calendário do PNI por idade do bebê selecionado, permitir marcar
vacina como aplicada. Highlights pra vacinas atrasadas/próximas.

### Endpoints
- `GET /vaccines/catalog`
- `GET /babies/:babyId/vaccine-schedule`
- `GET/POST/PATCH/DELETE /babies/:babyId/vaccine-records`

### Trabalho

**PR 4A — Catálogo + schedule**
- [ ] `features/vaccines/api/vaccines.api.ts`
- [ ] `features/vaccines/hooks/`
- [ ] `features/vaccines/types.ts` — Vaccine, VaccineRecord, BabyVaccineSchedule
- [ ] `features/vaccines/utils/groupByAge.ts` — agrupa vacinas por marco (nascer, 2m, 4m, …)

**PR 4B — Telas**
- [ ] VaccineCalendarScreen — lista agrupada por idade, ícones de status
  (aplicada/atrasada/futura)
- [ ] VaccineDetailScreen — info da vacina (descrição, doses, intervalo)
- [ ] RegisterVaccineScreen — registrar aplicação (data, lote, profissional, local)
- [ ] Badge de "atrasadas" na tab da home

**PR 4C — Polish**
- [ ] EmptyState quando não tem bebê selecionado
- [ ] Pull-to-refresh
- [ ] Testes: utils/groupByAge, hooks principais

### Critério de aceite
- [ ] Sem bebê selecionado → tela vazia com CTA "Selecionar bebê"
- [ ] Com bebê → lista completa do PNI com status por dose
- [ ] Marcar dose aplicada → atualiza status na lista (optimistic update)
- [ ] Editar registro de aplicação
- [ ] Excluir registro (com Dialog de confirmação)
- [ ] Vacinas atrasadas em destaque vermelho

### Anotações
- Calendar PNI já está seedado no banco (migration `SeedVaccinesPNI`).
- Optimistic update no marcar como aplicada — UX fica instantâneo.
- Considerar `react-native-calendars` se precisar visão calendário propriamente
  dita; lista agrupada por idade é mais simples e provavelmente suficiente.

---

## M5 — Consultas (estimativa: 4–5 dias)

### Objetivo
Agendar, listar, completar e cancelar consultas médicas do bebê. Lembretes
push são gerados pelo backend (já existe `appointments-reminder.job`) —
chegará quando push estiver ativo (M6).

### Endpoints
- `GET /babies/:babyId/appointments` (com filtros)
- `POST /babies/:babyId/appointments`
- `GET/PATCH/DELETE /babies/:babyId/appointments/:id`
- `POST /babies/:babyId/appointments/:id/complete` (CompleteAppointmentDto)
- `POST /babies/:babyId/appointments/:id/cancel` (CancelAppointmentDto)

### Trabalho

**PR 5A — API + hooks**
- [ ] `features/appointments/api/appointments.api.ts`
- [ ] `features/appointments/hooks/`
- [ ] Schemas zod

**PR 5B — Telas**
- [ ] AppointmentsListScreen — agrupado por status (próximas, passadas, canceladas)
- [ ] AppointmentFormScreen (create + edit) — react-hook-form com date picker
- [ ] AppointmentDetailScreen — com ações Completar/Cancelar (Bottom Sheet ou Dialog)
- [ ] FAB pra criar nova consulta

### Critério de aceite
- [ ] Criar consulta com especialidade, médico, data/hora, local, observações
- [ ] Editar consulta agendada
- [ ] Completar consulta com notas pós-consulta
- [ ] Cancelar com motivo
- [ ] Filtros: status, especialidade
- [ ] Próxima consulta destacada na Home

### Anotações
- Date picker: usar `@react-native-community/datetimepicker` (peer-to-add).
- Time zone: backend usa UTC; mobile exibe local. Cuidado com TZ ao serializar.

---

## M6 — Medicamentos + Push FCM (estimativa: 10–12 dias)

### Objetivo
Cadastrar remédios com cronograma de doses, ver doses do dia, marcar como
tomada/pulada. **Ativar push notifications** (lembretes de dose e consulta).
Esse M é o mais complexo do mobile.

### Endpoints
- `GET/POST/GET/PATCH/DELETE /babies/:babyId/medications`
- `POST/PATCH/DELETE /babies/:babyId/medications/:medicationId/schedules`
- `GET /babies/:babyId/doses/today`, `GET /babies/:babyId/doses` (filtros)
- `POST /babies/:babyId/doses/:id/take|skip|reset`
- `PUT /users/me/fcm-token`

### Trabalho

**PR 6A — Setup Firebase / FCM**
- [ ] `npm install @react-native-firebase/app @react-native-firebase/messaging`
- [ ] Configurar `google-services.json` (Android) — adicionar ao `.gitignore` e
      criar template `google-services.example.json`
- [ ] iOS: `GoogleService-Info.plist`, capability "Push Notifications" +
      "Background Modes → Remote notifications"
- [ ] `features/notifications/setup.ts` — initFCM, requestPermission, getToken,
      registrar listener foreground/background
- [ ] Hook `useFcmTokenSync()` — chama `PUT /users/me/fcm-token` ao logar
- [ ] Tela de permissão amigável (Bottom Sheet Paper) no primeiro post-login

**PR 6B — Medicamentos CRUD**
- [ ] `features/medications/api/`, `hooks/`, `schemas/`
- [ ] MedicationsListScreen
- [ ] MedicationFormScreen (com schedules como nested form — start_date,
      end_date, frequency, doses_per_day, dose_amount, dose_unit, use_alarm)
- [ ] MedicationDetailScreen com lista de schedules

**PR 6C — Doses do dia**
- [ ] TodayDosesScreen ("Hoje") — lista cronológica de doses do dia
- [ ] Ação: marcar tomada / pular (com motivo) / resetar
- [ ] Indicador visual: pendente / tomada / pulada / atrasada
- [ ] Tab dedicada na home pra "Hoje"

**PR 6D — Deep links de notificação**
- [ ] Configurar `linking` no NavigationContainer com schemes:
      `bebecare://dose/:doseId`, `bebecare://appointment/:apptId`
- [ ] Handler de notificação clicada → navega pra tela certa
- [ ] Notificação foreground → Snackbar Paper

### Critério de aceite
- [ ] Cadastrar medicamento + schedule
- [ ] Schedule com alarme gera dose logs no backend (job `create-daily-dose-logs`)
- [ ] Tela "Hoje" lista doses do dia
- [ ] Marcar dose como tomada/pulada atualiza UI instantâneo
- [ ] Push de lembrete chega no horário (job `med-dose-alarms`)
- [ ] Clicar push abre a dose específica
- [ ] Permissão pedida com flow amigável
- [ ] FCM token registrado no backend ao logar e ao trocar

### Anotações
- iOS push só funciona em device físico ou simulador macOS 13+ recente.
  No emulador Android funciona.
- Modo background: notificação chega via FCM; foreground também via FCM mas
  precisa renderizar manualmente (Snackbar).
- Para token rotation: `messaging().onTokenRefresh(...)` → atualiza no backend.

---

## M7 — Receitas médicas (upload) (estimativa: 6–7 dias)

### Objetivo
Tirar foto / escolher PDF de receita médica, anexar ao bebê. Listar receitas
com thumbnail.

### Trabalho backend (PRÉ-REQUISITO)
- [ ] Criar módulo `prescriptions` em `apps/api/src/modules/`
- [ ] Entity: id, baby_id, doctor, issued_at, notes, file_url, file_type, mime, size
- [ ] Storage: Cloudinary (mais fácil) ou S3 (mais barato escala) ou local /uploads
  com nginx serve (dev only)
- [ ] Endpoints: GET/POST/DELETE `/babies/:babyId/prescriptions`
- [ ] Multipart upload via `@nestjs/platform-express` + `multer` ou pré-signed URL
- [ ] Migration

### Trabalho mobile
- [ ] `npm install react-native-image-picker react-native-document-picker`
- [ ] `features/prescriptions/api/prescriptions.api.ts`
- [ ] PrescriptionsListScreen com Grid Paper Card thumbnail
- [ ] AddPrescriptionScreen com ActionSheet: Câmera / Galeria / PDF
- [ ] PrescriptionDetailScreen com viewer (imagem inline / `react-native-pdf`)

### Critério de aceite
- [ ] Anexar foto da câmera
- [ ] Anexar imagem da galeria
- [ ] Anexar PDF
- [ ] Listagem com thumbnail
- [ ] Visualizar receita full-screen
- [ ] Excluir com confirmação

### Anotações
- Recomendação: **Cloudinary com pré-signed URL**. Mobile pega URL temporária do
  backend, faz upload direto pro Cloudinary, manda URL final pro backend salvar.
  Reduz carga no servidor NestJS.
- iOS: pedir `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` no Info.plist.
- Android: permissões câmera no manifest.

---

## M8 — Lista de compras WebSocket (estimativa: 8–10 dias)

### Objetivo
Lista compartilhada entre membros da família, atualizada em tempo real (um
adiciona item → outro vê instantâneo). Showcase de WebSocket no portfolio.

### Trabalho backend (PRÉ-REQUISITO)
- [ ] Criar módulo `shopping` em `apps/api/`
- [ ] Entity `ShoppingItem`: id, family_id, title, qty, unit, checked, checked_by,
      created_by, created_at, updated_at
- [ ] CRUD REST: GET/POST/PATCH/DELETE `/families/me/shopping`
- [ ] Gateway WebSocket: `@WebSocketGateway` em `/shopping`
  - Eventos: `item:created`, `item:updated`, `item:deleted`, `item:checked`
  - Auth do socket via JWT no handshake
  - Room por family_id
- [ ] Migration

### Trabalho mobile
- [ ] `npm install socket.io-client` (se backend usar socket.io) ou usar
      `WebSocket` nativo se for WS puro
- [ ] `shared/socket/client.ts` — instância única do socket, reconnect logic,
      auth no handshake
- [ ] `features/shopping/api/shopping.api.ts` (REST fallback) + hooks
- [ ] `features/shopping/hooks/useShoppingSocket.ts` — assina eventos e atualiza
      cache do React Query via `qc.setQueryData(...)`
- [ ] ShoppingListScreen — lista com checkbox, swipe-to-delete, FAB add
- [ ] Indicador "alguém editando" (opcional)

### Critério de aceite
- [ ] Adicionar item → aparece pro outro device em <1s
- [ ] Marcar como comprado → atualiza pro outro
- [ ] Excluir → desaparece pros dois
- [ ] Reconexão automática quando rede cai e volta
- [ ] Cache funciona offline (last seen state)

### Anotações
- Decisão pendente: socket.io vs WebSocket puro. Socket.io é mais fácil
  (reconnect, rooms, ack). WS puro é mais leve. Pro projeto, **socket.io**
  é a escolha pragmática.
- Snapshot inicial sempre via REST (`GET shopping`) + subscribe ao socket
  pra updates. Evita race ao montar.

---

## M9 — Diário + Export PDF (estimativa: 5–6 dias)

### Objetivo
Registrar marcos/eventos do bebê (sorriso, primeiro dente, sentou, andou…).
Exportar histórico em PDF.

### Trabalho backend (PRÉ-REQUISITO)
- [ ] Módulo `diary` em `apps/api/`
- [ ] Entity `DiaryEntry`: id, baby_id, occurred_at, type, title, description, photo_url
- [ ] Enum `DiaryEntryType` (FIRST_SMILE, FIRST_TOOTH, FIRST_STEP, SAT_UP, …)
- [ ] CRUD: GET/POST/PATCH/DELETE `/babies/:babyId/diary`
- [ ] Endpoint export: `GET /babies/:babyId/diary/export` → retorna PDF binário
  (usar `pdfkit` ou `puppeteer` no NestJS)
- [ ] Migration

### Trabalho mobile
- [ ] `features/diary/api/`, `hooks/`
- [ ] DiaryTimelineScreen — feed cronológico reverso
- [ ] AddDiaryEntryScreen — tipo (select), data, descrição, foto opcional
- [ ] Filtro por tipo
- [ ] Botão "Exportar PDF" → baixa PDF e abre via `Share` nativo

### Critério de aceite
- [ ] Registrar marco com foto
- [ ] Editar/excluir
- [ ] Linha do tempo cronológica
- [ ] Filtros por tipo
- [ ] Export PDF do histórico completo
- [ ] Share PDF (WhatsApp, email)

---

## M10 — Polish + CI + Sentry + Release (estimativa: 6–8 dias)

### Objetivo
Deixar o app apresentável no portfolio e idealmente publicável em track interno
no Play Console.

### Trabalho

**Qualidade**
- [ ] `mobile-ci.yml` no `.github/workflows/`:
      - On `push`/`pr` filtrado por `paths: apps/mobile/**`
      - Jobs: lint, typecheck, jest
      - Matrix Node 20, 22
- [ ] Husky + lint-staged na raiz do monorepo (formata staged antes do commit)
- [ ] Commitlint com `@commitlint/config-conventional`

**Observabilidade**
- [ ] Sentry mobile (`@sentry/react-native`)
- [ ] Source maps no build release
- [ ] Filtro de PII (não logar tokens, email, …)

**UX**
- [ ] `react-native-bootsplash` — splash screen decente
- [ ] App icon próprio (substituir o default do RN)
- [ ] Empty states em todas as listas
- [ ] Error boundaries com tela "algo deu errado"
- [ ] Loading skeletons (Paper `Surface` com `ActivityIndicator`)

**Documentação**
- [ ] `apps/mobile/README.md` com setup passo a passo
- [ ] Screenshots no `docs/screenshots/`
- [ ] GIFs de fluxo principal
- [ ] Atualizar `README.md` da raiz com seção "Demo"

**Release (opcional)**
- [ ] Conta Google Play Console paga (US$25 one-time)
- [ ] Build release assinado: `cd android && ./gradlew bundleRelease`
- [ ] Upload AAB no track interno
- [ ] Convidar tester(s) por email

### Critério de aceite
- [ ] `mobile-ci.yml` verde em todo PR de mobile
- [ ] Husky bloqueia commit com lint quebrado
- [ ] Crash de teste capturado no Sentry
- [ ] Splash + ícone customizados
- [ ] README completo com print/GIF

---

## Notas operacionais

### Como retomar amanhã (M2)
```bash
# 1. PR #15 e #16 já mergeados no GitHub:
git checkout main
git pull origin main

# 2. Criar branch do M2:
git checkout -b feat/mobile-m2-auth

# 3. Confirmar que o npm install funcionou e o app boota:
cd apps/mobile
npm install        # ainda nao foi rodado!
# adicionar a linha apply from: fonts.gradle no android/app/build.gradle (vector-icons)
npm start --reset-cache
# em outro terminal:
npm run android
# clica em "Entrar (placeholder)" -> vai pra Home -> "Sair" -> volta pra Login
# se isso funciona, M1 está ok, parte pra M2
```

### Pendências legado
- 3 mudanças Prettier em `apps/api/src/modules/medications/*` ainda no working
  tree. Stash antes de mexer no backend (M7+):
  ```bash
  git stash push apps/api/src/modules/medications/jobs/med-dose-alarms.job.ts \
                 apps/api/src/modules/medications/medications.module.ts \
                 apps/api/test/notifications.e2e-spec.ts \
                 -m "chore(api): prettier autoformat"
  ```

### Estimativa total
**Mobile do M2 ao M10: ~60–75 dias úteis** se trabalhar consistente em sprints.
Considerando o ritmo de pai de bebê de 9 meses + projeto pessoal, planejar
~4 meses calendário pra fechar M10.

### Regras de PR
1. Branch sempre saindo de `main` atualizada.
2. PR pequeno (preferência por <500 linhas mudadas).
3. Squash and merge na main.
4. Não pushar branch sem `npm run lint && npm test` localmente.

### Quando parar pra refatorar
- Quando 3+ features tiverem código duplicado → sobe pra `shared/`.
- Quando uma feature passar de 8 telas → considerar dividir em sub-features.
- Quando `src/shared/components/` passar de 15 componentes → criar UI kit
  interno em `packages/ui` (acompanha decisão de migrar pra workspaces).
