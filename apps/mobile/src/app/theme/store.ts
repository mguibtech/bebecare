/**
 * Store de preferencias de tema (paleta + modo escolhidos pelo usuário).
 *
 * Guarda:
 * - `palette`: 'azul' ou 'rosa' (escolha visual)
 * - `modePreference`: 'light' | 'dark' | 'system'
 *    - 'light' / 'dark': forca o modo, ignora o sistema
 *    - 'system' (default): segue o useColorScheme() do RN, muda quando o
 *       Android troca de tema
 *
 * Persiste em MMKV. Hidratacao acontece no boot do AppProviders.
 */

import { create } from 'zustand';

import { kv } from '@/shared/storage/mmkv';

import type { PaletteName } from './tokens';

/** Preferencia de modo escolhida pelo usuário (NAO o modo efetivo). */
export type ModePreference = 'light' | 'dark' | 'system';

const PALETTE_KEY = 'theme.palette';
const MODE_KEY = 'theme.modePreference';

/**
 * Default da paleta para usuarios novos.
 *
 * Hoje: 'azul' (mantem coerencia com quem já instalou).
 * Futuro (M3): quando o usuário cadastrar o bebê com sex definido,
 * podemos sugerir trocar pra rosa baseado em sex='female' via prompt
 * opt-in — não automaticamente. Anotacao no MOBILE_ROADMAP.md (M3).
 */
const DEFAULT_PALETTE: PaletteName = 'azul';
const DEFAULT_MODE: ModePreference = 'system';

type ThemeState = {
  palette: PaletteName;
  modePreference: ModePreference;
  setPalette: (palette: PaletteName) => void;
  setModePreference: (mode: ModePreference) => void;
  hydrate: () => void;
};

function isValidModePreference(v: string | undefined): v is ModePreference {
  return v === 'light' || v === 'dark' || v === 'system';
}

export const useThemeStore = create<ThemeState>((set) => ({
  palette: DEFAULT_PALETTE,
  modePreference: DEFAULT_MODE,

  hydrate() {
    const storedPalette = kv.getString(PALETTE_KEY);
    if (storedPalette === 'azul' || storedPalette === 'rosa') {
      set({ palette: storedPalette });
    }

    const storedMode = kv.getString(MODE_KEY);
    if (isValidModePreference(storedMode)) {
      set({ modePreference: storedMode });
    }
    // Sem else: defaults já foram inicializados acima.
  },

  setPalette(palette) {
    kv.setString(PALETTE_KEY, palette);
    set({ palette });
  },

  setModePreference(mode) {
    kv.setString(MODE_KEY, mode);
    set({ modePreference: mode });
  },
}));
