/**
 * Bottom Tabs principais (5): Início, Hoje, Vacinas, Saúde, Mais.
 *
 * - Início: dashboard centrado no bebê (HomeScreen)
 * - Hoje: doses do dia do bebê selecionado (M6)
 * - Vacinas: calendário PNI (M4)
 * - Saúde: consultas + medicamentos (M5/M6)
 * - Mais: família, configurações, diário, receitas, sair
 *
 * Cada tab vai expandir pra Stack interno quando precisar de sub-screens
 * (ex.: Vacinas → VaccineDetail). Mas BabyForm/BabyDetail ficam no AppStack
 * pai (full-screen, sem tabs visiveis durante o fluxo).
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { HomeScreen } from '@/features/babies/screens/HomeScreen';
import { TodayDosesScreen } from '@/features/medications/screens/TodayDosesScreen';
import { VaccinesScreen } from '@/features/vaccines/screens/VaccinesScreen';
import { HealthScreen } from '@/features/health/screens/HealthScreen';
import { MoreScreen } from '@/features/settings/screens/MoreScreen';
import type { AppTheme } from '@/app/theme';

import type { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

type IconProps = { color: string; size: number };

// Componentes nomeados pra evitar warning `react/no-unstable-nested-components`.
function HomeIcon({ color, size }: IconProps) {
  return <MaterialCommunityIcons name="home-variant" color={color} size={size} />;
}
function TodayIcon({ color, size }: IconProps) {
  return <MaterialCommunityIcons name="calendar-check" color={color} size={size} />;
}
function VaccinesIcon({ color, size }: IconProps) {
  return <MaterialCommunityIcons name="needle" color={color} size={size} />;
}
function HealthIcon({ color, size }: IconProps) {
  return <MaterialCommunityIcons name="heart-pulse" color={color} size={size} />;
}
function MoreIcon({ color, size }: IconProps) {
  return <MaterialCommunityIcons name="dots-horizontal" color={color} size={size} />;
}

export function MainTabs() {
  const theme = useTheme<AppTheme>();

  return (
    <Tab.Navigator
      screenOptions={{
        // Cada tab cuida do seu proprio "header" (título grande na tela)
        // dentro do conteudo — evita header duplicado e libera espaco vertical.
        // As screens das tabs precisam de SafeAreaView no topo pra não colar
        // na status bar.
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Today"
        component={TodayDosesScreen}
        options={{
          title: 'Hoje',
          tabBarLabel: 'Hoje',
          tabBarIcon: TodayIcon,
        }}
      />
      <Tab.Screen
        name="Vaccines"
        component={VaccinesScreen}
        options={{
          title: 'Vacinas',
          tabBarLabel: 'Vacinas',
          tabBarIcon: VaccinesIcon,
        }}
      />
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{
          title: 'Saúde',
          tabBarLabel: 'Saúde',
          tabBarIcon: HealthIcon,
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'Mais',
          tabBarLabel: 'Mais',
          tabBarIcon: MoreIcon,
        }}
      />
    </Tab.Navigator>
  );
}
