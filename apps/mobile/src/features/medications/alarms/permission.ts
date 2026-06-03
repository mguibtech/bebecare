/**
 * Permissao de alarme EXATO (Android 12+ / API 31).
 *
 * Sem ela o AlarmManager so dispara de forma inexata (a janela pode atrasar
 * minutos), o que mata o proposito de um lembrete de medicacao. O notifee
 * reporta o estado em getNotificationSettings().android.alarm e oferece um
 * atalho pra tela do sistema onde o usuario concede.
 *
 * Fluxo just-in-time: so pedimos quando o usuario ativa o PRIMEIRO schedule com
 * useAlarm=true (ver wiring em useMedicationAlarmSync / form), nunca no launch.
 */

import { Platform } from 'react-native';
import notifee, { AndroidNotificationSetting } from '@notifee/react-native';

/**
 * true  -> pode agendar alarmes exatos (ou plataforma nao exige, ex.: iOS e
 *          Android < 12, onde a permissao e implicita).
 * false -> Android 12+ com a permissao revogada; precisa mandar pro sistema.
 */
export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const settings = await notifee.getNotificationSettings();
  const alarm = settings.android?.alarm;

  // NOT_SUPPORTED = Android < 12, onde alarme exato e sempre permitido.
  return (
    alarm === AndroidNotificationSetting.ENABLED ||
    alarm === AndroidNotificationSetting.NOT_SUPPORTED ||
    alarm === undefined
  );
}

/**
 * Abre a tela do sistema "Alarmes e lembretes" pro usuario conceder a permissao
 * de alarme exato. No-op fora do Android. Nao bloqueia: o app volta ao foco
 * quando o usuario sai dessa tela; o re-sync acontece no proximo foco/refetch.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await notifee.openAlarmPermissionSettings();
}
