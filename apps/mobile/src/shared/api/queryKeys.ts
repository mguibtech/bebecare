/**
 * Query keys centralizadas.
 *
 * Por que centralizar:
 * - Evita typos espalhados (`['auth/me']` vs `['auth', 'me']`).
 * - Facilita invalidate em cascata (`queryClient.invalidateQueries({ queryKey: qk.auth.all })`).
 * - Documenta o "namespace" de cada feature.
 *
 * Convencao: hierarquica do mais generico ao mais especifico.
 *   qk.auth.all        -> ['auth']
 *   qk.auth.me()       -> ['auth', 'me']
 *   qk.babies.all      -> ['babies']
 *   qk.babies.detail(id) -> ['babies', id]
 */

export const qk = {
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  babies: {
    all: ['babies'] as const,
    list: () => ['babies', 'list'] as const,
    detail: (id: string) => ['babies', 'detail', id] as const,
  },
  family: {
    all: ['family'] as const,
    me: () => ['family', 'me'] as const,
  },
  vaccines: {
    all: ['vaccines'] as const,
    catalog: () => ['vaccines', 'catalog'] as const,
    /** Schedule de um bebe especifico (com status calculado). */
    schedule: (babyId: string) =>
      ['vaccines', 'schedule', babyId] as const,
    /** Historico de records de um bebe. */
    records: (babyId: string) =>
      ['vaccines', 'records', babyId] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    /** Lista filtrada por scope (upcoming/past/all). */
    list: (babyId: string, scope?: string) =>
      ['appointments', 'list', babyId, scope ?? 'all'] as const,
    detail: (babyId: string, id: string) =>
      ['appointments', 'detail', babyId, id] as const,
  },
  medications: {
    all: ['medications'] as const,
    list: (babyId: string) =>
      ['medications', 'list', babyId] as const,
    detail: (babyId: string, id: string) =>
      ['medications', 'detail', babyId, id] as const,
  },
  doseLogs: {
    all: ['doseLogs'] as const,
    list: (babyId: string, scope?: string) =>
      ['doseLogs', 'list', babyId, scope ?? 'all'] as const,
    today: (babyId: string) => ['doseLogs', 'today', babyId] as const,
  },
  /** Despertadores pessoais (M7) — por usuario, nao por bebe. */
  alarms: {
    all: ['alarms'] as const,
    list: () => ['alarms', 'list'] as const,
    detail: (id: string) => ['alarms', 'detail', id] as const,
  },
} as const;
