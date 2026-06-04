/**
 * Permissões necessarias pro alarme local de remédio funcionar de verdade.
 *
 * Tres camadas (todas independentes do Firebase — o alarme não precisa de push):
 *
 *  1. POST_NOTIFICATIONS (Android 13+): sem ela o SO SUPRIME a notificação do
 *     alarme silenciosamente. Pedida via notifee.requestPermission() (mostra o
 *     dialog do sistema na primeira vez; depois retorna o status sem re-perguntar).
 *  2. SCHEDULE_EXACT_ALARM (Android 12+): sem ela o disparo e inexato (atrasa).
 *     USE_EXACT_ALARM (no manifest) auto-concede na maioria dos casos; o fallback
 *     manda o usuário pra tela do sistema.
 *  3. USE_FULL_SCREEN_INTENT (Android 14+): sem ela o alarme não abre em tela
 *     cheia na lockscreen, degradando pra heads-up. O notifee NAO expoe o estado
 *     dessa permissão, entao so oferecemos o atalho pras configurações.
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
 * Pede a permissão de notificação (dialog do sistema na 1a vez). Independente do
 * Firebase. Retorna true se concedida.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return isAuthorized(settings.authorizationStatus);
}

/** Status atual da permissão de notificação SEM disparar o dialog. */
export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return isAuthorized(settings.authorizationStatus);
}

/** Abre os ajustes de notificação do app (quando o usuário já negou antes). */
export async function openNotificationSettings(): Promise<void> {
  await notifee.openNotificationSettings();
}

/**
 * Abre a tela de otimizacao de bateria do app. Em devices agressivos
 * (Xiaomi/Huawei/Oppo) desabilitar a otimizacao e o que garante o alarme tocar.
 */
export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await notifee.openBatteryOptimizationSettings();
  } catch {
    // alguns devices não expoem a tela: ignora.
  }
}

// ============================================================
// Alarme exato (SCHEDULE_EXACT_ALARM)
// ============================================================

/**
 * true  -> pode agendar alarmes exatos (ou a plataforma não exige: iOS e
 *          Android < 12, onde e implicito).
 * false -> Android 12+ com a permissão revogada.
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
 * Abre a tela do sistema onde o usuário libera "notificações em tela cheia" pro
 * app. O notifee não tem helper pra isso; tentamos o intent específico do
 * Android 14+ e, se falhar, caimos nos ajustes de notificação do app.
 *
 * Best-effort: não da pra DETECTAR o estado dessa permissão via notifee, entao
 * isso e sempre oferecido como uma dica, nunca como bloqueio.
 */
export async function openFullScreenIntentSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT (Android 14+). O RN não envia o
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
 * Garante as permissões do alarme no momento em que o usuário ativa um (pede
 * notificação, checa exact alarm). Retorna o status pra o chamador decidir o
 * que orientar. Não mostra UI — quem chama (promptAlarmPermissions) cuida disso.
 */
export async function ensureAlarmPermissions(): Promise<AlarmPermissionStatus> {
  const notifications = await requestNotificationPermission();
  const exactAlarm = await canScheduleExactAlarms();
  return { notifications, exactAlarm };
}
