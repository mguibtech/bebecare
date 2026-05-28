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
} as const;
