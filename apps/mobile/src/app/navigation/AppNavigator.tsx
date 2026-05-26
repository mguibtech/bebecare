import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen } from '@/features/babies/screens/HomeScreen';

import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'BebeCare' }}
      />
    </Stack.Navigator>
  );
}
