/**
 * Permissões e ajustes do sistema relevantes pros alarmes (remédio, despertador)
 * e Modo Soninho. Cada item abre a tela nativa correspondente — o usuário concede
 * lá. Não dá pra LER o estado de todas via JS, então listamos como atalhos
 * explicados, não como toggles.
 */

import { useTranslation } from 'react-i18next';
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

export function PermissionsScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  const items: Item[] = [
    {
      icon: 'bell-ring-outline',
      title: t('permissions.notificationsTitle'),
      description: t('permissions.notificationsDesc'),
      onPress: () => {
        openNotificationSettings();
      },
    },
    {
      icon: 'alarm-check',
      title: t('permissions.exactAlarmTitle'),
      description: t('permissions.exactAlarmDesc'),
      onPress: () => {
        openExactAlarmSettings();
      },
    },
    {
      icon: 'fullscreen',
      title: t('permissions.fullScreenTitle'),
      description: t('permissions.fullScreenDesc'),
      onPress: () => {
        openFullScreenIntentSettings();
      },
    },
    {
      icon: 'battery-alert-variant-outline',
      title: t('permissions.batteryTitle'),
      description: t('permissions.batteryDesc'),
      onPress: () => {
        openBatteryOptimizationSettings();
      },
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MutedText variant="bodyMedium" style={styles.intro}>
          {t('permissions.intro')}
        </MutedText>

        <Card mode="outlined">
          {items.map((item, i) => (
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
          {t('permissions.footer')}
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
