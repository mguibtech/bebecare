import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Stack publica (deslogado).
 * - Login: tela inicial.
 * - Register: navegavel a partir do Login.
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
