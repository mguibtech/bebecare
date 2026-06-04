/**
 * Store do "bebê selecionado" — qual bebê da família esta no contexto atual.
 *
 * Por que existe: features como Vacinas, Consultas, Remédios (M4-M6) operam
 * SEMPRE em cima de UM bebê específico. O ID selecionado fica aqui pra
 * cada feature pegar via hook sem prop drilling.
 *
 * Persiste em MMKV. Hidratacao no boot junto com auth/theme.
 *
 * Regras:
 *  - Se a família tem 1 bebê, autoselect ao buscar lista (via useBabies effect).
 *  - Se o bebê selecionado for deletado, o consumer precisa limpar (setSelected null).
 *  - Pode ser null transitorio (família sem bebês ainda, ou depois de delete).
 */

import { create } from 'zustand';

import { kv } from '@/shared/storage/mmkv';

const STORAGE_KEY = 'babies.selectedId';

type BabySelectorState = {
  selectedBabyId: string | null;
  hydrate: () => void;
  setSelected: (id: string | null) => void;
};

export const useBabySelectorStore = create<BabySelectorState>((set) => ({
  selectedBabyId: null,

  hydrate() {
    const stored = kv.getString(STORAGE_KEY);
    if (stored && stored.length > 0) {
      set({ selectedBabyId: stored });
    }
  },

  setSelected(id) {
    if (id === null) {
      kv.remove(STORAGE_KEY);
    } else {
      kv.setString(STORAGE_KEY, id);
    }
    set({ selectedBabyId: id });
  },
}));
