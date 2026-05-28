import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BabyFormScreen } from '@/features/babies/screens/BabyFormScreen';
import { BabyDetailScreen } from '@/features/babies/screens/BabyDetailScreen';
import { FamilyScreen } from '@/features/family/screens/FamilyScreen';
import { VaccineDetailScreen } from '@/features/vaccines/screens/VaccineDetailScreen';

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
  return (
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
    </Stack.Navigator>
  );
}
