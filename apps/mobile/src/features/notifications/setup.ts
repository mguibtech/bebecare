/**
 * Wrappers de baixo nivel sobre o @react-native-firebase/messaging (API modular).
 *
 * Regras:
 *  - Funcoes aqui NAO checam isFirebaseConfigured() — o chamador garante que o
 *    Firebase esta configurado antes de chamar (senao messaging() lanca).
 *  - Sem UI e sem dependencia de React: sao helpers puros. Snackbar, navegacao
 *    e fluxo de permissao vivem nos hooks/components da feature.
 *
 * Mapeamento de permissao (AuthorizationStatus do FCM):
 *  - AUTHORIZED (1) / PROVISIONAL (2) → 'granted'
 *  - DENIED (0)                       → 'denied'
 *  - NOT_DETERMINED (-1)              → 'undetermined'
 */

import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
  requestPermission,
  setBackgroundMessageHandler,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

function toStatus(authStatus: number): PermissionStatus {
  if (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  if (authStatus === AuthorizationStatus.NOT_DETERMINED) {
    return 'undetermined';
  }
  return 'denied';
}

/** Status atual da permissao SEM disparar o prompt do sistema. */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  const status = await hasPermission(getMessaging());
  return toStatus(status);
}

/**
 * Dispara o prompt nativo de permissao (Android 13+ / iOS) e retorna o status
 * resultante. No-op visual se o usuario ja decidiu antes.
 */
export async function askPermission(): Promise<PermissionStatus> {
  const status = await requestPermission(getMessaging());
  return toStatus(status);
}

/** Token FCM atual do device (null se indisponivel). */
export async function fetchToken(): Promise<string | null> {
  try {
    return await getToken(getMessaging());
  } catch {
    return null;
  }
}

/** Assina mensagens recebidas com o app em foreground. Retorna unsubscribe. */
export function subscribeForeground(
  handler: (message: RemoteMessage) => void,
): () => void {
  return onMessage(getMessaging(), handler);
}

/** Assina rotacao de token (FCM troca o token de tempos em tempos). */
export function subscribeTokenRefresh(
  handler: (token: string) => void,
): () => void {
  return onTokenRefresh(getMessaging(), handler);
}

/**
 * Registra o handler de mensagens em background/quit. DEVE ser chamado no escopo
 * de modulo (index.js), fora da arvore React.
 *
 * O FCM ja exibe a notificacao automaticamente (campo `notification` do payload),
 * entao nao ha nada a renderizar aqui. O deep-link ao tocar na notificacao e
 * tratado quando o app abre (M6/6D).
 */
export function registerBackgroundHandler(): void {
  setBackgroundMessageHandler(getMessaging(), async () => {
    // Sem trabalho: a notificacao e exibida pelo SO. Placeholder pro 6D.
  });
}
