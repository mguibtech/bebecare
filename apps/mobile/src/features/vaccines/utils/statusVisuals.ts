/**
 * Mapeamento status → recursos visuais (cor, icone, label) usados em chips
 * de status nas telas de vacinas.
 *
 * Centralizado aqui pra UI consistente entre VaccineCalendarScreen, badges
 * na tab e telas futuras (ex.: dashboard "Hoje" no M6).
 *
 * Cores derivam do tema atual (rosa/azul × light/dark) pra coerencia.
 */

import type { AppTheme } from '@/app/theme';

import { VaccineStatus } from '../types';

export type StatusVisual = {
  label: string;
  icon: string;
  /** Cor pro chip (foreground). */
  color: string;
  /** Cor de fundo do chip. */
  backgroundColor: string;
};

export function getStatusVisuals(
  status: VaccineStatus,
  theme: AppTheme,
): StatusVisual {
  switch (status) {
    case VaccineStatus.APPLIED:
      return {
        label: 'Aplicada',
        icon: 'check-circle',
        color: theme.app.success,
        // Tinte translucido (24 = 14% alpha em hex) pra fundo suave.
        backgroundColor: theme.app.success + '24',
      };
    case VaccineStatus.OVERDUE:
      return {
        label: 'Atrasada',
        icon: 'alert-circle',
        color: theme.colors.error,
        backgroundColor: theme.colors.error + '24',
      };
    case VaccineStatus.DUE:
      return {
        label: 'No prazo',
        icon: 'clock-outline',
        color: theme.app.warning,
        backgroundColor: theme.app.warning + '24',
      };
    case VaccineStatus.UPCOMING:
      return {
        label: 'Em breve',
        icon: 'calendar-clock',
        color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface,
        backgroundColor: theme.colors.surfaceVariant,
      };
  }
}
