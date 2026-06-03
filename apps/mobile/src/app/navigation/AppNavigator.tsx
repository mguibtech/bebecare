import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BabyFormScreen } from '@/features/babies/screens/BabyFormScreen';
import { BabyDetailScreen } from '@/features/babies/screens/BabyDetailScreen';
import { FamilyScreen } from '@/features/family/screens/FamilyScreen';
import { VaccineDetailScreen } from '@/features/vaccines/screens/VaccineDetailScreen';
import { AppointmentFormScreen } from '@/features/appointments/screens/AppointmentFormScreen';
import { AppointmentDetailScreen } from '@/features/appointments/screens/AppointmentDetailScreen';
import { MedicationFormScreen } from '@/features/medications/screens/MedicationFormScreen';
import { MedicationDetailScreen } from '@/features/medications/screens/MedicationDetailScreen';
import {
  useAlarmDeepLink,
  useMedicationAlarmSync,
} from '@/features/medications/hooks';
import { AlarmsListScreen } from '@/features/alarms/screens/AlarmsListScreen';
import { AlarmFormScreen } from '@/features/alarms/screens/AlarmFormScreen';
import {
  useAlarmSync,
  useAlarmDeepLink as useFeedingAlarmDeepLink,
} from '@/features/alarms/hooks';
import {
  NotificationPermissionGate,
  useFcmTokenSync,
} from '@/features/notifications';

import { MainTabs } from './MainTabs';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Stack autenticada — MainTabs no root, screens "full screen" empilhadas
 * por cima (BabyForm, BabyDetail) escondem o tabs bar durante o fluxo.
 *
 * Quando precisar adicionar uma sub-screen sem esconder o tabs bar, criar
 * Stack interno dentro da tab correspondente (ex.: VaccinesStack).
 */
export function AppNavigator() {
  // Push: registra/sincroniza o token FCM enquanto logado (no-op sem Firebase).
  useFcmTokenSync();
  // Alarmes locais: reagenda os despertadores de remedio sempre que a lista do
  // bebe selecionado muda (e no launch). No-op se o notifee ainda nao estiver
  // no build nativo.
  useMedicationAlarmSync();
  // Deep-link: toque no alarme abre a aba "Hoje" (em vez da home).
  useAlarmDeepLink();
  // Despertadores (M7): reagenda os alarmes pessoais e roteia o toque deles.
  useAlarmSync();
  useFeedingAlarmDeepLink();

  return (
    <>
      <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BabyForm"
        component={BabyFormScreen}
        // title definido dentro da tela (depende se eh create ou edit)
      />
      <Stack.Screen
        name="BabyDetail"
        component={BabyDetailScreen}
        options={{ title: 'Perfil do bebe' }}
      />
      <Stack.Screen
        name="Family"
        component={FamilyScreen}
        options={{ title: 'Familia' }}
      />
      <Stack.Screen
        name="VaccineDetail"
        component={VaccineDetailScreen}
        options={{ title: 'Vacina' }}
      />
      <Stack.Screen
        name="AppointmentForm"
        component={AppointmentFormScreen}
        // title definido dentro da tela (create vs edit)
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ title: 'Consulta' }}
      />
      <Stack.Screen
        name="MedicationForm"
        component={MedicationFormScreen}
        // title dentro da tela (create vs edit)
      />
      <Stack.Screen
        name="MedicationDetail"
        component={MedicationDetailScreen}
        options={{ title: 'Remédio' }}
      />
      <Stack.Screen
        name="Alarms"
        component={AlarmsListScreen}
        options={{ title: 'Despertadores' }}
      />
      <Stack.Screen
        name="AlarmForm"
        component={AlarmFormScreen}
        // title dentro da tela (create vs edit)
      />
      </Stack.Navigator>
      {/* Pre-prompt de permissao de push (1x no primeiro acesso logado). */}
      <NotificationPermissionGate />
    </>
  );
}
