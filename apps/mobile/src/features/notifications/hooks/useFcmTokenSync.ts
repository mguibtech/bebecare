/**
 * Mantem o token FCM sincronizado com o backend enquanto o usuario esta logado.
 *
 * Montar UMA vez na arvore autenticada (AppNavigator). Responsabilidades:
 *  1. No mount: se o Firebase esta configurado E a permissao ja foi concedida
 *     (em sessoes anteriores), registra o token atual no backend. Cobre o
 *     "registra ao logar" do criterio do M6.
 *  2. Assina a rotacao de token (FCM troca periodicamente) → reenvia ao backend.
 *  3. Assina mensagens em foreground → mostra Snackbar (o SO nao exibe
 *     notificacao quando o app esta aberto).
 *
 * Quando o Firebase NAO esta configurado (sem google-services.json), o hook e
 * inteiramente no-op.
 *
 * Obs.: o fluxo de PEDIR permissao (primeiro acesso) vive no
 * NotificationPermissionGate — aqui so reagimos a uma permissao ja existente.
 */

import { useEffect } from 'react';

import { snackbar } from '@/shared/feedback';

import { notificationsApi } from '../api/notifications.api';
import { isFirebaseConfigured } from '../lib/firebase';
import { syncFcmToken } from '../lib/syncToken';
import {
  getPermissionStatus,
  subscribeForeground,
  subscribeTokenRefresh,
  type RemoteMessage,
} from '../setup';

function showForeground(message: RemoteMessage): void {
  const title = message.notification?.title;
  const body = message.notification?.body;
  const text = [title, body].filter(Boolean).join(' — ');
  if (text) {
    snackbar.show(text, { variant: 'info' });
  }
}

export function useFcmTokenSync(): void {
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let active = true;

    // 1. Registra token atual se a permissao ja existe.
    (async () => {
      const status = await getPermissionStatus();
      if (active && status === 'granted') {
        await syncFcmToken();
      }
    })();

    // 2. Rotacao de token → reenvia direto (token ja vem no callback).
    const unsubRefresh = subscribeTokenRefresh((token) => {
      notificationsApi.putFcmToken(token).catch(() => {
        // best-effort: proxima sincronizacao corrige.
      });
    });

    // 3. Foreground → Snackbar.
    const unsubForeground = subscribeForeground(showForeground);

    return () => {
      active = false;
      unsubRefresh();
      unsubForeground();
    };
  }, []);
}
