/**
 * Hook de logout.
 *
 * Fluxo:
 * 1. Tenta revogar o refreshToken no backend (best-effort — se falhar, segue).
 * 2. Limpa tokens (Keychain) e estado local (auth.store).
 * 3. Limpa todo o cache do React Query — próximo login fetcha do zero.
 *
 * Por que best-effort no backend: o usuário quer sair AGORA; rede pode estar
 * fora. O refresh token revogado fica como "lixo" no DB ate expirar (30 dias),
 * mas isso eh aceitavel — outro device continua valido independentemente.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelAllMedicationAlarms } from '@/features/medications/alarms';
import { cancelAllAlarms } from '@/features/alarms/notifee';
import { stopPlayback } from '@/features/sleep/player';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { isFirebaseConfigured } from '@/features/notifications/lib/firebase';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      // Remove o token FCM deste device do usuário atual (best-effort, ainda
      // autenticado). Sem isso, o backend continuaria empurrando push deste
      // usuário pro device depois do logout. Roda antes de revogar a sessao.
      if (isFirebaseConfigured()) {
        try {
          await notificationsApi.putFcmToken(null);
        } catch {
          // best-effort: ignora erro de rede.
        }
      }

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          await authApi.logout({ refreshToken });
        } catch {
          // best-effort: ignora erro de rede / token já revogado.
        }
      }
    },
    onSettled: async () => {
      // Cancela os alarmes locais (remédio + despertadores) da conta que esta
      // saindo — senao continuariam tocando no device depois do logout.
      try {
        await Promise.all([
          cancelAllMedicationAlarms(),
          cancelAllAlarms(),
          stopPlayback(),
        ]);
      } catch {
        // notifee/track-player indisponivel: ignora.
      }
      // Sempre limpa local, mesmo se backend falhou.
      await useAuthStore.getState().signOut();
      queryClient.clear();
    },
  });
}
