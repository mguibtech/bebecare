/**
 * Permissões e ajustes do sistema relevantes pros alarmes (remédio, despertador)
 * e Modo Soninho. Cada item abre a tela nativa correspondente — o usuário concede
 * lá. Não dá pra LER o estado de todas via JS, então listamos como atalhos
 * explicados, não como toggles.
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Text, useTheme } from 'react-native-paper';

import { MutedText } from '@/shared/components';
import {
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  openNotificationSettings,
} from '@/features/medications/alarms';
import type { AppTheme } from '@/app/theme';

type Item = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

const ITEMS: Item[] = [
  {
    icon: 'bell-ring-outline',
    title: 'Notificações',
    description: 'Sem isso, alarmes e lembretes não aparecem.',
    onPress: () => {
      openNotificationSettings();
    },
  },
  {
    icon: 'alarm-check',
    title: 'Alarmes e lembretes (alarme exato)',
    description: 'Garante que o alarme toque na hora certa, sem atraso.',
    onPress: () => {
      openExactAlarmSettings();
    },
  },
  {
    icon: 'fullscreen',
    title: 'Notificações em tela cheia',
    description: 'Faz o alarme abrir por cima da tela bloqueada, tipo despertador.',
    onPress: () => {
      openFullScreenIntentSettings();
    },
  },
  {
    icon: 'battery-alert-variant-outline',
    title: 'Otimização de bateria',
    description:
      'Em Xiaomi/Samsung/Huawei, desative a otimização pro BebeCare — senão o sistema pode segurar o alarme.',
    onPress: () => {
      openBatteryOptimizationSettings();
    },
  },
];

export function PermissionsScreen() {
  const theme = useTheme<AppTheme>();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MutedText variant="bodyMedium" style={styles.intro}>
          Pra os alarmes e o Modo Soninho funcionarem de verdade, o Android pede
          algumas permissões. Toque em cada item pra abrir o ajuste do sistema.
        </MutedText>

        <Card mode="outlined">
          {ITEMS.map((item, i) => (
            <View key={item.title}>
              {i > 0 && <View style={styles.divider} />}
              <List.Item
                title={item.title}
                description={item.description}
                descriptionNumberOfLines={3}
                onPress={item.onPress}
                // eslint-disable-next-line react/no-unstable-nested-components -- render-prop do Paper
                left={(props) => <List.Icon {...props} icon={item.icon} />}
                // eslint-disable-next-line react/no-unstable-nested-components -- render-prop do Paper
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
              />
            </View>
          ))}
        </Card>

        <Text variant="labelSmall" style={[styles.footer, { color: theme.app.text.muted }]}>
          O BebeCare nunca pede mais do que precisa pros lembretes do seu bebê.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  intro: {
    marginBottom: 16,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.25)',
    marginLeft: 56,
  },
  footer: {
    textAlign: 'center',
    marginTop: 16,
  },
});
