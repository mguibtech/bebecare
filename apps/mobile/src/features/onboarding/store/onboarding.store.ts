/**
 * Controla se o usuario ja viu o onboarding (mostrado 1x na 1a vez).
 *
 * MMKV e' sincrono, entao o estado inicial le direto do storage no create —
 * sem precisar de hydrate assincrono. `complete()` marca como visto e persiste.
 */

import { create } from 'zustand';

import { kv } from '@/shared/storage/mmkv';

const SEEN_KEY = 'onboarding.seen';

type OnboardingState = {
  seen: boolean;
  complete: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  seen: kv.getBool(SEEN_KEY) ?? false,
  complete() {
    kv.setBool(SEEN_KEY, true);
    set({ seen: true });
  },
}));
