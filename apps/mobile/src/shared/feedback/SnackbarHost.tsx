/**
 * Renderizador global do Snackbar — montado uma vez em AppProviders.
 *
 * Le do store e renderiza o Paper Snackbar com:
 *  - Background derivado da variant (success/error/info)
 *  - Action opcional (label + handler)
 *  - Duracao padrao 3.5s (suficiente pra ler, nao chato)
 *  - Posicao bottom (default Paper) — usuario nao tampa o conteudo
 */

import { StyleSheet } from 'react-native';
import { Snackbar, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/app/theme';

import { useSnackbarStore } from './snackbar.store';

export function SnackbarHost() {
  const theme = useTheme<AppTheme>();
  const visible = useSnackbarStore((s) => s.visible);
  const message = useSnackbarStore((s) => s.message);
  const variant = useSnackbarStore((s) => s.variant);
  const action = useSnackbarStore((s) => s.action);
  const hide = useSnackbarStore((s) => s.hide);

  // Cores por variant — derivam do tema pra coerencia.
  const backgroundColor =
    variant === 'success'
      ? theme.app.success
      : variant === 'error'
        ? theme.colors.error
        : undefined;

  const textColor =
    variant === 'success' || variant === 'error'
      ? '#FFFFFF'
      : undefined;

  // Quando tem `action`, duracao maior (6s) pra dar tempo do usuario ler
  // a label do botao e decidir se quer interagir. Sem action, 3.5s eh
  // suficiente pra mensagem de confirmacao simples.
  const duration = action ? 6000 : 3500;

  return (
    <Snackbar
      visible={visible}
      onDismiss={hide}
      duration={duration}
      style={[
        styles.snackbar,
        backgroundColor ? { backgroundColor } : null,
      ]}
      action={
        action
          ? {
              label: action.label,
              onPress: () => {
                action.onPress();
                hide();
              },
              textColor,
            }
          : undefined
      }
    >
      {message}
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 8,
  },
});
