/**
 * Snackbar global do app — qualquer feature pode disparar.
 *
 * Padrao de uso:
 *   import { snackbar } from '@/shared/feedback';
 *   snackbar.showSuccess('Bebê cadastrado!');
 *   snackbar.showError('Erro de rede');
 *
 * Renderizado pelo SnackbarHost (em AppProviders) — sem precisar de
 * Snackbar local em cada tela.
 */

import { create } from 'zustand';

export type SnackbarVariant = 'success' | 'error' | 'info';

export type SnackbarAction = {
  label: string;
  onPress: () => void;
};

type SnackbarState = {
  visible: boolean;
  message: string;
  variant: SnackbarVariant;
  action?: SnackbarAction;
  /** Show com opções. */
  show: (
    message: string,
    opts?: { variant?: SnackbarVariant; action?: SnackbarAction },
  ) => void;
  /** Atalho pra variant='success'. */
  showSuccess: (message: string, action?: SnackbarAction) => void;
  /** Atalho pra variant='error'. */
  showError: (message: string, action?: SnackbarAction) => void;
  hide: () => void;
};

export const useSnackbarStore = create<SnackbarState>((set) => ({
  visible: false,
  message: '',
  variant: 'info',
  action: undefined,

  show(message, opts) {
    set({
      visible: true,
      message,
      variant: opts?.variant ?? 'info',
      action: opts?.action,
    });
  },

  showSuccess(message, action) {
    set({
      visible: true,
      message,
      variant: 'success',
      action,
    });
  },

  showError(message, action) {
    set({
      visible: true,
      message,
      variant: 'error',
      action,
    });
  },

  hide() {
    set({ visible: false });
  },
}));

/**
 * Atalho imperativo pra usar fora de componentes (hooks, mutations).
 * Em componentes funcionais, prefira `useSnackbarStore(s => s.showSuccess)`
 * pra evitar re-renders desnecessarios.
 */
export const snackbar = {
  show: (
    message: string,
    opts?: { variant?: SnackbarVariant; action?: SnackbarAction },
  ) => useSnackbarStore.getState().show(message, opts),
  showSuccess: (message: string, action?: SnackbarAction) =>
    useSnackbarStore.getState().showSuccess(message, action),
  showError: (message: string, action?: SnackbarAction) =>
    useSnackbarStore.getState().showError(message, action),
  hide: () => useSnackbarStore.getState().hide(),
};
