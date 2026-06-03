/**
 * Permissoes necessarias pro alarme local de remedio funcionar de verdade.
 *
 * Tres camadas (todas independentes do Firebase — o alarme nao precisa de push):
 *
 *  1. POST_NOTIFICATIONS (Android 13+): sem ela o SO SUPRIME a notificacao do
 *     alarme silenciosamente. Pedida via notifee.requestPermission() (mostra o
 *     dialog do sistema na primeira vez; depois retorna o status sem re-perguntar).
 *  2. SCHEDULE_EXACT_ALARM (Android 12+): sem ela o disparo e inexato (atrasa).
 *     USE_EXACT_ALARM (no manifest) auto-concede na maioria dos casos; o fallback
 *     manda o usuario pra tela do sistema.
 *  3. USE_FULL_SCREEN_INTENT (Android 14+): sem ela o alarme nao abre em tela
 *     cheia na lockscreen, degradando pra heads-up. O notifee NAO expoe o estado
 *     dessa permissao, entao so oferecemos o atalho pras configuracoes.
 */

import { Linking, Platform } from 'react-native';
import notifee, {
  AndroidNotificationSetting,
  AuthorizationStatus,
} from '@notifee/react-native';

// ============================================================
// Notificacao (POST_NOTIFICATIONS)
// ============================================================

function isAuthorized(status: AuthorizationStatus): boolean {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Pede a permissao de notificacao (dialog do sistema na 1a vez). Independente do
 * Firebase. Retorna true se concedida.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return isAuthorized(settings.authorizationStatus);
}

/** Status atual da permissao de notificacao SEM disparar o dialog. */
export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return isAuthorized(settings.authorizationStatus);
}

/** Abre os ajustes de notificacao do app (quando o usuario ja negou antes). */
export async function openNotificationSettings(): Promise<void> {
  await notifee.openNotificationSettings();
}

// ============================================================
// Alarme exato (SCHEDULE_EXACT_ALARM)
// ============================================================

/**
 * true  -> pode agendar alarmes exatos (ou a plataforma nao exige: iOS e
 *          Android < 12, onde e implicito).
 * false -> Android 12+ com a permissao revogada.
 */
export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const settings = await notifee.getNotificationSettings();
  const alarm = settings.android?.alarm;

  return (
    alarm === AndroidNotificationSetting.ENABLED ||
    alarm === AndroidNotificationSetting.NOT_SUPPORTED ||
    alarm === undefined
  );
}

/** Abre a tela do sistema "Alarmes e lembretes". No-op fora do Android. */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openAlarmPermissionSettings();
}

// ============================================================
// Tela cheia (USE_FULL_SCREEN_INTENT)
// ============================================================

/**
 * Abre a tela do sistema onde o usuario libera "notificacoes em tela cheia" pro
 * app. O notifee nao tem helper pra isso; tentamos o intent especifico do
 * Android 14+ e, se falhar, caimos nos ajustes de notificacao do app.
 *
 * Best-effort: nao da pra DETECTAR o estado dessa permissao via notifee, entao
 * isso e sempre oferecido como uma dica, nunca como bloqueio.
 */
export async function openFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT (Android 14+). O RN nao envia o
    // data `package:`, entao em alguns devices abre a lista geral; se nem isso
    // existir, lanca e caimos no fallback.
    await Linking.sendIntent('android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT');
  } catch {
    try {
      await notifee.openNotificationSettings();
    } catch {
      // sem tela pra abrir: desiste silenciosamente.
    }
  }
}

// ============================================================
// Orquestracao
// ============================================================

export type AlarmPermissionStatus = {
  /** POST_NOTIFICATIONS concedida. */
  notifications: boolean;
  /** Pode agendar alarmes exatos. */
  exactAlarm: boolean;
};

/**
 * Garante as permissoes do alarme no momento em que o usuario ativa um (pede
 * notificacao, checa exact alarm). Retorna o status pra o chamador decidir o
 * que orientar. Nao mostra UI — quem chama (promptAlarmPermissions) cuida disso.
 */
export async function ensureAlarmPermissions(): Promise<AlarmPermissionStatus> {
  const notifications = await requestNotificationPermission();
  const exactAlarm = await canScheduleExactAlarms();
  return { notifications, exactAlarm };
}
