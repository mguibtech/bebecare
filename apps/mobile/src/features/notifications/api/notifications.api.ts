/**
 * Camada HTTP do dominio notifications.
 *
 *   PUT /users/me/fcm-token   registra/atualiza o token FCM do device atual
 *                             (body { fcmToken: string | null }; null remove)
 */

import { apiClient } from '@/shared/api/client';

export const notificationsApi = {
  /** Registra o token FCM no backend. `null` remove o registro (ex.: logout). */
  async putFcmToken(fcmToken: string | null): Promise<void> {
    await apiClient.put('/users/me/fcm-token', { fcmToken });
  },
};
