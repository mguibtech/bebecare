/**
 * Sincroniza o token FCM do device com o backend.
 *
 * Une duas pecas: pega o token atual do FCM (setup.fetchToken) e registra no
 * backend (notificationsApi.putFcmToken). Usado tanto pelo hook de sync no
 * login quanto pela tela de permissao logo apos o usuario conceder acesso.
 *
 * Best-effort: se a rede falhar, apenas loga em dev — o token sera reenviado no
 * proximo boot/login ou na proxima rotacao (onTokenRefresh).
 */

import { notificationsApi } from '../api/notifications.api';
import { fetchToken } from '../setup';

export async function syncFcmToken(): Promise<string | null> {
  try {
    const token = await fetchToken();
    await notificationsApi.putFcmToken(token);
    return token;
  } catch (err) {
    if (__DEV__) {
      console.warn('[notifications] falha ao sincronizar token FCM', err);
    }
    return null;
  }
}
