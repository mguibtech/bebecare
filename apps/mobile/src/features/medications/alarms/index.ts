/**
 * API publica dos alarmes locais de remedio (notifee, M6/B8).
 *
 * Consumido por:
 *  - useMedicationAlarmSync: reconcilia os alarmes quando a lista muda.
 *  - useLogout (cleanup): cancelAllMedicationAlarms() ao sair da conta.
 */

export {
  syncMedicationAlarms,
  cancelAllMedicationAlarms,
  type AlarmSyncResult,
} from './scheduler';
export { canScheduleExactAlarms, openExactAlarmSettings } from './permission';
export { ensureAlarmChannel } from './channel';
export { registerAlarmBackgroundHandler } from './background';
