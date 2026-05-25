# 🗺 Roadmap da V1 — BebeCare publicável

> Documento de planejamento técnico para o **primeiro release** do BebeCare na Google Play Store.
> Não é demo: é uma V1 funcional que o autor e a esposa usam no dia a dia com o filho de 9 meses.
> Novas funcionalidades virão na V2.

**Status:** 🚧 em planejamento (Fase 1 — Fundação)
**Tag-alvo:** `v1.0.0`
**Plataforma de lançamento:** Google Play Store (Android primeiro; iOS pode ficar para V2 por causa do custo da conta Apple Developer)

---

## 1. Escopo da V1

### ✅ Entra na V1

Estas são as funcionalidades **essenciais** para o app ser útil de verdade desde o dia do lançamento. Vou usar com a Família, então tem que estar polido.

| # | Funcionalidade | Diferencial |
|---|---|---|
| 1 | **Cadastro + login** (email/senha) com JWT | Base de tudo |
| 2 | **Convite de casal** (código de 6 dígitos) | Dois usuários veem os mesmos dados do bebê |
| 3 | **Cadastro do bebê** (nome, sexo, data de nascimento, peso/altura iniciais) | Tela inicial pós-login |
| 4 | **Calendário de vacinas PNI** com checklist | Diferencial principal vs. apps internacionais |
| 5 | **Agenda de consultas pediátricas** | Lembretes 1 dia antes via push |
| 6 | **Lista de remédios com lembretes push** | Horário/dose, com snooze |
| 7 | **Tela "Hoje"** consolidando vacinas atrasadas + consultas próximas + remédios do dia | Dashboard que o usuário abre primeiro |
| 8 | **Configurações** (perfil, gerenciar casal, logout) | |

### 📅 Vai para V2

| Funcionalidade | Por que adiar |
|---|---|
| Upload de receitas médicas (foto/PDF) | Requer storage S3-like, encarece infra; não é bloqueador |
| Lista de compras compartilhada em tempo real (WebSocket) | Adiciona Socket.IO + reconexão; complexidade desproporcional pra V1 |
| Diário de marcos do desenvolvimento | Nice-to-have, não é dor diária |
| Exportar histórico em PDF | Pode esperar feedback dos usuários V1 |
| Modo escuro | V1 só light theme |
| iOS | Conta Apple Developer US$ 99/ano — adiar até validar tração |
| Internacionalização | V1 só pt-BR |

---

## 2. Roteiro de execução (ordem do código)

### Fase A — Back end (API NestJS)

A ordem é estritamente bottom-up: dado → camada de serviço → controller → autorização.

#### A1. Fundação do domínio
- [ ] `BaseEntity` abstrata (id UUID, `created_at`, `updated_at`, `deleted_at` para soft delete)
- [ ] Entity `User` (email único, senha hash com bcrypt, nome, FCM token)
- [ ] Entity `Couple` (1 a 2 users; representa o casal)
- [ ] Entity `CoupleInvite` (código de 6 dígitos, expira em 7 dias, status pending/accepted/expired)
- [ ] Entity `Baby` (nome, sexo, data nascimento, peso/altura, FK para Couple)
- [ ] Migration inicial `0001_initial_schema`

#### A2. Auth
- [ ] Módulo `auth/`
- [ ] DTOs: `RegisterDto`, `LoginDto`, `JwtPayload`
- [ ] `AuthService` (register, login, validateUser, hashPassword)
- [ ] `AuthController` (POST `/auth/register`, POST `/auth/login`, GET `/auth/me`)
- [ ] `JwtStrategy` (Passport)
- [ ] `JwtAuthGuard` global + decorator `@Public()` para rotas abertas
- [ ] Decorator `@CurrentUser()` para extrair user do request
- [ ] Testes unitários do `AuthService`
- [ ] Testes e2e dos endpoints

#### A3. Convite de casal
- [ ] Módulo `couples/`
- [ ] `CouplesService` (create, getCurrent, generateInvite, acceptInvite)
- [ ] `CouplesController` (POST `/couples/invites`, POST `/couples/invites/:code/accept`, GET `/couples/me`)
- [ ] Validação: usuário só pode estar em um casal por vez

#### A4. Perfil do bebê
- [ ] Módulo `babies/`
- [ ] `BabiesService` (create, findAllForCouple, findOne, update, remove)
- [ ] `BabiesController` (CRUD completo em `/babies`)
- [ ] Validação: somente users do mesmo casal acessam os bebês

#### A5. Vacinas PNI (estrutura do calendário)
- [ ] Entity `Vaccine` (catálogo PNI: nome, dose, idade mínima em meses, idade máxima opcional)
- [ ] Entity `VaccineRecord` (FK Baby + FK Vaccine + data aplicada + lote opcional + notas)
- [ ] Seed do PNI brasileiro (BCG, Hepatite B, Pentavalente, VIP, Pneumo10, Rotavírus, Meningo C, FebreAmarela, Tríplice viral, Varicela, etc.)
- [ ] Módulo `vaccines/`
- [ ] Endpoints: GET `/vaccines/catalog`, GET `/babies/:id/vaccine-schedule`, POST `/babies/:id/vaccines/:vaccineId/record`
- [ ] Cálculo: idade do bebê em meses → quais doses estão no prazo/atrasadas/futuras

#### A6. Consultas
- [ ] Entity `Appointment` (FK Baby, título, data, local, notas, status agendada/realizada/cancelada)
- [ ] Módulo `appointments/`
- [ ] CRUD completo
- [ ] Job de notificação (lembrete 24h antes via FCM)

#### A7. Medicações
- [ ] Entity `Medication` (FK Baby, nome, dose, unidade, instruções)
- [ ] Entity `MedSchedule` (FK Medication, horários, dias da semana, data início/fim, ativo)
- [ ] Módulo `medications/`
- [ ] CRUD + endpoint "doses de hoje"
- [ ] Job de push para os horários ativos

#### A8. Push notifications (FCM)
- [ ] Módulo `notifications/`
- [ ] Service que envia para o FCM token do user
- [ ] Endpoint POST `/users/me/fcm-token` para o app registrar o token
- [ ] Integração com `appointments` e `medications` para disparar lembretes

#### A9. Dashboard "Hoje"
- [ ] Endpoint GET `/dashboard/today` que retorna: vacinas atrasadas, próximas consultas (7 dias), doses do dia
- [ ] Otimizado para uma chamada só do mobile

### Fase B — Mobile (React Native CLI)

> Começa **depois** da Fase A2 (auth pronto). Mobile e back podem evoluir em paralelo a partir daí.

#### B1. Inicialização
- [ ] `npx @react-native-community/cli init` (manual no Windows do dev)
- [ ] Reorganização de pastas para `apps/mobile/`
- [ ] ESLint + Prettier alinhados com a API
- [ ] Configuração de Axios apontando para `http://10.0.2.2:3000/api` (emulador Android → host)

#### B2. Bibliotecas base
- [ ] React Navigation (native stack)
- [ ] TanStack Query (React Query) + QueryClientProvider
- [ ] Zustand para estado global (auth, casal selecionado)
- [ ] React Native Paper + tema customizado do BebeCare
- [ ] React Native Keychain para armazenar JWT
- [ ] React Native Vector Icons
- [ ] React Hook Form + Zod para validação de forms

#### B3. Auth UI
- [ ] Telas: Splash, Login, Register, Esqueci minha senha (placeholder)
- [ ] Fluxo de aceitar convite via deep link `bebecare://invite/:code`
- [ ] Hooks: `useLogin`, `useRegister`, `useMe`

#### B4. Onboarding pós-login
- [ ] Tela "Convidar parceiro(a)" (mostra código de 6 dígitos copiável + share sheet)
- [ ] Tela "Cadastrar bebê" (form com data picker)
- [ ] Roteamento condicional: sem bebê → onboarding; com bebê → dashboard

#### B5. Dashboard "Hoje"
- [ ] Tela inicial pós-login
- [ ] Cards: vacinas atrasadas, próximas consultas, doses do dia
- [ ] Pull-to-refresh

#### B6. Telas de vacinas
- [ ] Lista por status (atrasadas / no prazo / futuras)
- [ ] Botão "Marcar como aplicada" com modal de data/lote/notas
- [ ] Filtro por idade do bebê

#### B7. Telas de consultas
- [ ] Lista com agrupamento por mês
- [ ] Form de criar/editar consulta
- [ ] Detalhe da consulta

#### B8. Telas de remédios
- [ ] Lista de remédios ativos
- [ ] Form de criar/editar com horários
- [ ] Vista "Doses de hoje" com check-mark

#### B9. Configurações
- [ ] Perfil do usuário
- [ ] Gerenciar casal (ver parceiro, sair do casal)
- [ ] Logout
- [ ] Sobre / versão / política de privacidade (link)

#### B10. Push notifications
- [ ] Integração `@react-native-firebase/app` + `@react-native-firebase/messaging`
- [ ] Permissão de notificação no primeiro launch
- [ ] Envio do FCM token para a API
- [ ] Handler de notificação foreground/background/quit

### Fase C — Infraestrutura de produção

#### C1. Banco em nuvem
- [ ] Provisionar Postgres gerenciado
- [ ] Configurar `DATABASE_URL` no provedor da API
- [ ] Rodar migrations no banco de produção

#### C2. Hospedagem da API
- [ ] Provisionar serviço Node
- [ ] Variáveis de ambiente de produção (JWT secret, DATABASE_URL, FCM credentials)
- [ ] HTTPS automático (Render/Railway fazem nativamente)
- [ ] Healthcheck `/api/health` apontado para o serviço
- [ ] Cron para limpeza de convites expirados (uma vez por dia)

#### C3. Firebase
- [ ] Criar projeto Firebase
- [ ] Habilitar Cloud Messaging
- [ ] Gerar service account JSON (chave admin para a API enviar push)
- [ ] Baixar `google-services.json` para o Android
- [ ] Configurar no Gradle do mobile

#### C4. CI/CD do mobile
- [ ] GitHub Actions workflow `mobile-ci.yml` (type-check + lint, build do APK debug)
- [ ] Build do AAB de release (pode ser local primeiro; automação no V1.1)
- [ ] Assinatura com keystore (gerada localmente, guardada em GitHub Secrets para CI)

### Fase D — Publicação na Play Store

#### D1. Conta + listagem
- [ ] Conta Google Play Developer (taxa única **US$ 25**)
- [ ] Criar app na console
- [ ] Categoria: Saúde e fitness / Maternidade
- [ ] Conteúdo: Para todos (Rating IARC)

#### D2. Conformidade
- [ ] **Política de privacidade** publicada em URL pública (gerar com [https://www.privacypolicies.com](https://www.privacypolicies.com) ou copiar template do Termly e adaptar)
- [ ] **Termos de uso** (mesmo caminho)
- [ ] Formulário de **Data safety** na console (declarar coleta de email, nome, FCM token; nada de dados sensíveis de saúde por enquanto na V1)
- [ ] **LGPD:** mencionar coleta na política, oferecer endpoint de exclusão de conta
- [ ] Idade-alvo: 18+ (pais cadastrando dados do bebê, não menores como usuários)

#### D3. Assets gráficos
- [ ] Ícone do app (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] 2-8 screenshots de celular (1080x1920 ou 1080x2400)
- [ ] (Opcional) Vídeo de YouTube curto (30-60s) — boost de conversão
- [ ] Descrição curta (80 chars)
- [ ] Descrição completa (até 4000 chars) — em pt-BR

#### D4. Release técnico
- [ ] Build AAB de release assinado
- [ ] `versionCode=1`, `versionName="1.0.0"`
- [ ] Upload na faixa **Internal testing** primeiro (você + esposa + 2-3 amigos)
- [ ] Após 3-5 dias estáveis, promover para **Closed testing** (10-20 pessoas)
- [ ] Após mais uma semana, **Production**

---

## 3. Cronograma estimado

Trabalhando ~2h/dia em dias úteis + 4h/dia em fins de semana, contexto realista de pai de bebê:

| Bloco | Estimativa |
|---|---|
| Fase A (back: A1 a A9) | **3 a 4 semanas** |
| Fase B (mobile: B1 a B10) | **4 a 6 semanas** (pode rodar parcial em paralelo com A) |
| Fase C (infra produção) | **2 a 3 dias** concentrados |
| Fase D (Play Store: setup + testing tracks) | **2 a 3 semanas** corridas (Google demora pra revisar) |

**Total realista até V1 na Play Store: 8 a 12 semanas.** Pode ir mais rápido se tiver pico de tempo livre.

---

## 4. Decisões pendentes — recomendações pra bater o martelo

| Decisão | Recomendação | Alternativas |
|---|---|---|
| **Hospedagem da API** | **Render** (free tier OK pra V1, deploy via GitHub, sem cartão necessário) | Railway (US$ 5 free credit/mês), Fly.io (free tier), AWS (overkill pra V1) |
| **Banco em produção** | **Neon** (Postgres serverless, 0.5GB free, branching) | Supabase (free 500MB), Render Postgres (US$ 7/mês depois do free), Railway Postgres |
| **Hash de senha** | **bcrypt** (já nas deps) | argon2 (mais moderno mas exige build nativo) |
| **JWT** | **Só access token** com 7 dias na V1 | Refresh token na V2 quando tivermos mais sessões ativas |
| **Convite de casal** | **Código numérico de 6 dígitos**, expira em 7 dias | Link mágico (precisa SMTP), QR code (legal pra V2) |
| **IDs** | **UUID v7** (cronológico, índice eficiente) | autoincrement int (mais simples mas vaza ordem de criação) |
| **Soft delete** | **Sim**, com `deleted_at` em todas entidades | Hard delete (mais simples, sem desfazer) |
| **Hospedagem de assets (logo, política)** | **GitHub Pages** do próprio repo | Vercel, Cloudflare Pages |
| **Analytics** | **Pular na V1**; adicionar Firebase Analytics na V2 | PostHog (open source) |
| **Crash reporting** | **Sentry** free tier (5k errors/mês) | Firebase Crashlytics |
| **Lib de date picker no mobile** | `@react-native-community/datetimepicker` | `react-native-date-picker` |
| **Lib de forms no mobile** | **React Hook Form + Zod** | Formik + Yup |
| **Tema visual** | Cor primária **#5B8DEF** (azul bebê), secundária **#FFB0C2** (rosa suave) — neutras de gênero | Definir junto com a esposa |

---

## 5. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Free tier da API hibernar e dar timeout no primeiro request do dia | Healthcheck cron de 10min pingando `/api/health` |
| Conta Play Store ter espera de verificação | Pagar e abrir a conta **agora** (em paralelo com o dev) |
| FCM precisar de SHA-1 do keystore | Gerar keystore de release no início, registrar SHA-1 no Firebase |
| LGPD: dados do bebê são sensíveis | V1 não coleta diagnóstico nem foto — só nome, sexo, data nasc, peso/altura. Documentar bem na política |
| Esposa não usar o app | Validar UX com ela em protótipos antes de partir pro código |

---

## 6. Próxima ação ao voltar do almoço

Quando voltar, alinhar comigo as decisões pendentes da seção 4 (especialmente: hospedagem e Neon vs alternativas). Em seguida, começamos **A1 — Fundação do domínio** (BaseEntity + entities + migration inicial). Estimo 1-2 horas de pair programming pra fechar A1 e A2 (auth) juntos.

Em paralelo, você pode:

1. Rodar `.\scripts\setup-github.ps1` para criar milestones e labels
2. Criar a conta Google Play Developer (US$ 25, leva 1-2 dias pra liberar)
3. Criar o projeto Firebase (sem custo, pra ter pronto quando chegar em A8)
