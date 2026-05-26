# BebeCare — Arquitetura e práticas

Documento opinativo. Cada seção responde "o que fazer", "por quê" e "alternativa
que rejeitei". Foco em práticas de mercado em React Native + NestJS em 2026, não
em academicismo (sem Clean Architecture canônica, sem use-cases por arquivo).

## 1. Stack escolhida (resumo)

| Camada            | Escolha                                         | Por quê                                        |
|-------------------|-------------------------------------------------|-----------------------------------------------|
| Backend           | NestJS + TypeORM + PostgreSQL                   | Já dominado, decorators, DI forte             |
| Mobile            | React Native CLI bare (NÃO Expo) + TS strict    | Controle nativo total, FCM sem EAS            |
| Estado server     | TanStack Query v5                               | Cache, dedupe, retry, mutations — padrão atual |
| Estado cliente    | Zustand                                         | Leve, sem boilerplate de Redux                |
| UI                | React Native Paper (Material 3)                 | Acessibilidade, componentes prontos, tema     |
| Navegação         | React Navigation 7 (native-stack + bottom-tabs) | Performance nativa via react-native-screens   |
| HTTP              | axios + interceptors                            | Mais ergonômico que fetch para o que faremos  |
| Forms             | react-hook-form + zod                           | Mínimo re-render, schema único FE↔BE          |
| Auth secreto      | react-native-keychain                           | Keystore/Keychain nativos, NÃO AsyncStorage   |
| Cache local       | react-native-mmkv                               | 10–30x mais rápido que AsyncStorage           |
| Datas             | date-fns                                        | Tree-shakable, locale pt-BR                   |
| Push              | Firebase Cloud Messaging                        | Bem mantido, custo zero, multi-plataforma     |
| Tests             | Jest + @testing-library/react-native            | Padrão atual (react-test-renderer está EOL)   |

## 2. Monorepo

A escolha já feita ([memory: monorepo de pobre]) — duas apps independentes em
`apps/mobile` e `apps/api`, sem npm workspaces. Vantagem: zero acoplamento de
versões, cada app instala o que quer. Custo: sem deduplicação de deps comuns,
sem package compartilhado (`@bebecare/types`).

**Quando vale migrar pra workspaces:** quando tivermos um `packages/contracts`
com tipos/zod-schemas reusados entre FE e BE. Hoje não temos. Adiar.

**Alternativa rejeitada:** Nx/Turborepo. Overkill pro tamanho do projeto. O dia
em que `npm install` em ambas pastas começar a doer, reconsiderar.

## 3. Backend (NestJS) — arquitetura por módulo

Padrão NestJS canônico, sem inventar:

```
apps/api/src/
  modules/
    auth/         Controller, Service, JwtStrategy, Guards, DTOs
    babies/       CRUD + regras de negócio
    vaccines/     PNI catálogo + vaccine_records
    appointments/
    medications/  Medication, MedSchedule, MedDoseLog
    notifications/ Push fan-out, jobs cron
  common/         Filters, Interceptors, Pipes globais
  database/       DataSource, migrations
```

**Práticas opinativas:**

- **DTOs com class-validator + ValidationPipe global.** Não confiar em runtime
  sem schema.
- **Cada entidade ganha migration própria.** [memory: feedback_migrations] —
  nunca `synchronize: true`, mesmo em dev.
- **Services não retornam Entity direto pro controller.** Retornar
  Response DTOs com `class-transformer` `@Expose()` / `@Exclude()`. Evita vazar
  campos sensíveis (`password_hash`).
- **Repository injection só quando precisa de query customizada.** Para CRUD
  trivial, `@InjectRepository(Entity)` + métodos do TypeORM bastam. Não criar
  `BabyRepository extends Repository<Baby>` por status.
- **Use `@nestjs/event-emitter` para fan-out side effects** (ex: criar
  agendamento → emitir `appointment.created` → notifications module agenda
  push). Acopla menos do que injetar `NotificationsService` em todo lugar.
- **Guards globais via `APP_GUARD`** (JwtAuthGuard) e desativa com
  `@Public()` decorator. Mais seguro que opt-in.
- **Tests e2e batem em Postgres real**
  ([memory: feedback_test_env]). `NODE_ENV=test` stuba integrações externas
  (FCM, S3); banco é real.

**Anti-padrões a evitar:**

- Repository pattern manual em cima do TypeORM (já é Repository).
- Use-cases / Interactors em arquivos separados (overengineering para CRUD).
- Service injetando outro Service de outro módulo que ainda não foi exportado —
  preferir EventEmitter.

## 4. Mobile (React Native) — feature-based

A estrutura criada em M1:

```
apps/mobile/src/
  app/                     Composição raiz (não tem lógica de domínio)
    providers/             AppProviders, queryClient
    navigation/            RootNavigator, AuthNavigator, AppNavigator, types
    theme/                 tokens, MD3 extension
  features/                Cada feature é uma "mini-app"
    auth/
      api/                 Funções que falam com /auth
      hooks/               useLogin, useMe (React Query)
      screens/             LoginScreen, RegisterScreen
      store/               auth.store (Zustand, só estado local)
      schemas/             zod schemas
      types.ts             DTOs e tipos do domínio
    babies/
    vaccines/
    appointments/
    medications/
    shopping/              (Fase 4)
    diary/                 (Fase 5)
  shared/                  Tudo reusável entre features
    api/                   apiClient axios + ApiError
    components/            Button, Card, EmptyState
    hooks/                 useDebounce, etc
    storage/               secureStorage (Keychain), mmkv
    config/                env
    utils/                 formatDate, etc
```

**Por que feature-based e não layer-based (`components/`, `services/`,
`hooks/` no topo):**

- Quando você abre `features/vaccines/`, tudo o que existe sobre vacinas está
  ali. Move/deleta uma feature inteira sem caçar arquivos.
- Layer-based escala mal: aos 30 hooks fica difícil descobrir qual pertence a
  qual fluxo.
- Mantra: **se 2+ features compartilham, sobe pra `shared/`. Se só uma usa,
  fica dentro dela.**

**Regra de dependência:**

```
app/  → pode importar tudo (composição)
features/X/ → pode importar shared/ e app/theme — NÃO outras features
shared/ → não importa features/ nem app/
```

Cruzar features (ex: `medications` precisa de `babyId` da feature `babies`)
fazer por **prop drilling via navigation** ou por hook reutilizável em
`shared/` se virar regra geral. Nunca `import { useBaby } from
'@/features/babies'` direto.

**Alternativa rejeitada:** monolítica com `screens/`, `components/`,
`services/` no topo. Funciona pra app de 5 telas, vira lixo aos 30.

## 5. Camada HTTP e contratos

**Padrão por feature:**

```
features/vaccines/api/vaccines.api.ts        // Funções puras
features/vaccines/api/vaccines.hooks.ts      // useVaccines (Query), useCreateVaccine (Mutation)
features/vaccines/types.ts                   // Vaccine, VaccineRecord, CreateVaccineDto
features/vaccines/schemas/vaccine.schema.ts  // zod
```

`vaccines.api.ts` recebe o `apiClient` e retorna dados crus, **sem React
Query**. Os hooks ficam fininhos, só agrupam queryKey + queryFn.

```ts
// vaccines.api.ts
export async function fetchVaccines(): Promise<Vaccine[]> {
  const { data } = await apiClient.get<Vaccine[]>('/vaccines');
  return data;
}

// vaccines.hooks.ts
export const vaccinesKeys = {
  all: ['vaccines'] as const,
  list: () => [...vaccinesKeys.all, 'list'] as const,
  detail: (id: string) => [...vaccinesKeys.all, 'detail', id] as const,
};

export function useVaccines() {
  return useQuery({ queryKey: vaccinesKeys.list(), queryFn: fetchVaccines });
}
```

**Por que `queryKeys` como factory:** TypeScript infere o tipo da chave,
invalidações ficam tipadas (`qc.invalidateQueries({ queryKey: vaccinesKeys.all })`)
e você nunca digita string solta espalhada. Padrão recomendado pela própria doc
do TanStack Query.

**Tipos compartilhados FE↔BE:** quando criar `packages/contracts` no futuro,
mover os DTOs e schemas zod pra lá. Hoje, duplicar e manter alinhado
manualmente é aceitável dado o tamanho.

## 6. Estado: server vs cliente

Regra de ouro: **se o dado mora no servidor, vive no React Query. Senão,
Zustand.**

| Tipo de estado                          | Onde mora              |
|-----------------------------------------|------------------------|
| Lista de vacinas do bebê                | React Query            |
| Perfil do usuário logado                | React Query            |
| Token JWT (referência local)            | Zustand + Keychain     |
| Bebê selecionado no seletor             | Zustand (`useBabySelector`) |
| Estado de um formulário                 | react-hook-form        |
| Tema (light/dark) escolhido pelo usuário | Zustand + MMKV         |

**Anti-padrão:** colocar `babies` no Zustand e sincronizar manualmente com
fetch. Você acabou de reinventar (mal) o React Query.

## 7. Navegação

`RootNavigator` decide entre `AuthNavigator` (login/registro) e `AppNavigator`
(tab navigator + stacks aninhados) baseado no `useAuthStore().status`. Status
`'booting'` mostra splash interno enquanto o `hydrate()` carrega tokens do
Keychain.

**Tipagem de rotas obrigatória.** `AppStackParamList` declara cada rota e seus
params. `useNavigation()` infere sem genérico graças à augmentação em
`navigation/types.ts`.

**Deep links:** quando habilitarmos push notification com payload, a
notificação carrega uma URL (`bebecare://baby/123/vaccine/456`) e o
NavigationContainer resolve. Configurar `linking` prop.

## 8. UI e tema

**Paper MD3 estendido com tokens próprios** (spacing, radii). Componente
acessa via `useTheme<AppTheme>()` e lê `theme.app.spacing.md`. Isso evita
constantes mágicas espalhadas.

**Anti-padrão:** styled-components em RN. Funciona mas adiciona peso e o RN
não se beneficia das vantagens do styled-components em web (tema reativo já é
nativo do Paper). `StyleSheet.create` + tokens é mais rápido.

**Componentes próprios em `shared/components/` quando:**

- Compõe múltiplos Paper components com regras fixas (ex: `EmptyState` com
  ícone + título + CTA).
- Precisa de variante de marca (ex: `BebeButton` com cor primary fixa).

Caso contrário, usar Paper direto. Não criar wrapper só por criar.

## 9. Formulários

`react-hook-form` + `zod` + `@hookform/resolvers/zod`. Padrão:

```ts
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type LoginInput = z.infer<typeof loginSchema>;

const { control, handleSubmit } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
});
```

Mensagens em português direto no schema. NÃO usar i18n nessa camada por
enquanto — adiar até precisar.

`Controller` do hook-form para integrar com TextInput do Paper:

```tsx
<Controller
  control={control}
  name="email"
  render={({ field, fieldState }) => (
    <TextInput
      label="Email"
      value={field.value}
      onChangeText={field.onChange}
      error={!!fieldState.error}
    />
  )}
/>
```

## 10. Autenticação e segurança

- **Tokens:** access (curto, 15min) + refresh (longo, 30d). Guardar **os dois
  no Keychain**, nunca no MMKV.
- **Logout limpa Keychain + invalida queries:**
  `qc.clear()` no signOut do auth.store.
- **Convite de casal** (spec do projeto): backend gera token uso-único de 7
  dias; mobile abre via deep link `bebecare://invite/:token`.
- **Interceptor 401 = signOut hoje, refresh + retry depois.** Quando
  implementarmos refresh: usar `axios-auth-refresh` ou fila manual. Cuidado
  com race condition (múltiplos requests 401 simultâneos disparando refresh
  paralelo) — usar Promise singleton.
- **NUNCA logar tokens.** Adicionar redactor no logger.

## 11. Notificações push (FCM)

- **Backend** persiste device tokens em `user_devices` (criar entidade) e
  envia via `firebase-admin` server-side. Stub em testes
  ([memory: feedback_test_env]).
- **Mobile:** `@react-native-firebase/app` + `@react-native-firebase/messaging`.
  Solicitar permissão na primeira tela após login, não no boot.
- **Tipos de notificação:** lembrete de dose, lembrete de consulta, novo item
  na lista de compras (Fase 4). Cada uma carrega payload com `type` + ids
  necessários para deep-link.
- **iOS:** APNs config no Firebase Console, capability "Push Notifications" +
  "Background Modes → Remote notifications" no Xcode.

## 12. Testes

**Pirâmide pragmática:**

- **70% unit:** services do NestJS, funções puras de domínio (cálculo de
  próxima dose, cálculo de calendário PNI). Jest direto.
- **25% integração:** controllers NestJS com banco real, hooks RN com
  `@testing-library/react-native` + MSW pra mockar axios.
- **5% e2e:** fluxos críticos no backend (auth, criar bebê, vacina). Mobile
  e2e (Maestro/Detox) só quando o app tiver usuário pago — caro de manter.

**Cobertura não é métrica, é sintoma.** Não persiga 90% — persiga ter teste
nos pontos onde regressão dói (lógica de PNI, cálculo de doses, autenticação).

**MSW para mockar API no mobile** quando testar hooks de Query. Bem melhor
que `jest.mock('axios')`.

## 13. CI/CD e qualidade

**Já existe `api-ci.yml`** rodando migration + e2e
([memory: feedback_ci_migrations]). Adicionar:

- `mobile-ci.yml`: lint + typecheck + jest. NÃO builda APK no PR (lento e
  caro) — só na main.
- **Husky + lint-staged** na raiz do monorepo: prettier + eslint em arquivos
  staged. Bloqueia commit ruim.
- **commitlint** com Conventional Commits (`feat:`, `fix:`, `chore:`, etc).
  Já estamos usando, formalizar.
- **Build de release:**
  - Android: `./gradlew bundleRelease` → AAB no Play Console.
  - iOS: Xcode Cloud ou Fastlane. Custo: conta paga Apple Developer.
  - Adiar até hora de publicar.

## 14. Observabilidade

- **Backend:** logger NestJS estruturado (Pino), correlation ID por request,
  exportar pra stdout. Em produção, agregar com Grafana Loki ou Better Stack.
- **Mobile:** Sentry (free tier generoso). Captura crashes nativos + JS, com
  source maps. Configurar no M5+. Não no M1.
- **Métricas:** quando tiver usuários, PostHog (gratuito até 1M eventos) para
  funis de onboarding (quantos abrem o app → quantos completam cadastro do
  bebê).

## 15. Estilo de código

**Lint:** `@react-native/eslint-config` (mobile), `@typescript-eslint` (api).
Não inflar com 50 plugins. Recomendado adicionar:

- `eslint-plugin-import` com `import/order` (já vem em ambos os configs).
- `eslint-plugin-unused-imports` (auto-fix imports não usados em save).

**Prettier:** já configurado. `singleQuote`, `trailingComma: 'all'`.

**TypeScript strict:** ativado em ambos. Adicionei `noUncheckedIndexedAccess`
e `noImplicitOverride` no mobile (já no extends do RN). Recomendo no API
também.

**Convenções:**

- Nome de arquivo: `kebab-case.ts` para módulos, `PascalCase.tsx` para
  componente React.
- Nome de variável: inglês ([memory project rule]). Comentários: português.
- Imports: ordenar (1) builtins/node, (2) externos, (3) `@/` aliases,
  (4) relativos. ESLint impõe.
- **Sem default exports em features** (a não ser componente de tela usado
  pelo Stack.Screen). Named exports são mais refatoráveis.
- **`import type` quando só usa o tipo** ([memory: feedback_isolated_modules]).
- Evitar `any`. Se inevitável, comentar `// eslint-disable-next-line` com
  motivo.

## 16. Roadmap de adoção

| Quando        | O quê                                                |
|---------------|------------------------------------------------------|
| **Agora (M1)**| Estrutura src/, providers, navigation, auth.store    |
| **M2**        | Login real, useMe, refresh strategy                  |
| **M3**        | Telas de bebê, perfil, vacinas (PNI estático em JSON local primeiro) |
| **M4**        | Push FCM, lembrete de dose, agenda                   |
| **M5**        | Sentry, mobile-ci.yml, husky/lint-staged na raiz     |
| **M6**        | Upload de receitas (foto/PDF), S3 ou Cloudinary      |
| **M7**        | WebSocket pra lista compartilhada                    |
| **Depois**    | i18n, dark mode, deep links, biometria, Detox e2e    |

## 17. O que NÃO fazer (red flags comuns)

- Misturar `useState` de dado de servidor com `useQuery`. Escolha um.
- `useEffect` chamando fetch direto. Use `useQuery`.
- Componente de tela com mais de 200 linhas — quebrar em sub-componentes ou
  extrair hook.
- "Hook custom" que é só wrapper de outro hook sem agregar valor.
- `console.log` em PR. Configurar `no-console` no ESLint.
- Schemas zod duplicados em FE e BE sem source of truth. Quando doer, mover
  para `packages/contracts`.
- Componente acessando `apiClient` direto. Sempre via hook de feature.

---

Este documento é vivo. Quando uma escolha mudar (ex: trocar Zustand por Jotai,
ou mover pra Nx), atualizar a tabela do tópico 1 e documentar o por quê.
