/**
 * Picker de modo light/dark/system com SegmentedButtons do Paper.
 *
 * 3 opções:
 *  - 'light': forca tema claro, ignora sistema
 *  - 'dark':  forca tema escuro, ignora sistema
 *  - 'system' (default): segue o tema do Android/iOS
 *
 * Acao expedita: trocar o modo aqui re-renderiza o app inteiro porque o
 * AppProviders escuta o store via useAppTheme() (memoizado).
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import {
  useThemeStore,
  type ModePreference,
} from '@/app/theme/store';

export function ModePicker() {
  const { t } = useTranslation();
  const modePreference = useThemeStore((s) => s.modePreference);
  const setModePreference = useThemeStore((s) => s.setModePreference);

  return (
    <View style={styles.wrapper}>
      <SegmentedButtons
        value={modePreference}
        onValueChange={(v) => setModePreference(v as ModePreference)}
        buttons={[
          {
            value: 'light' satisfies ModePreference,
            label: t('appearance.modeLight'),
            icon: 'weather-sunny',
          },
          {
            value: 'dark' satisfies ModePreference,
            label: t('appearance.modeDark'),
            icon: 'weather-night',
          },
          {
            value: 'system' satisfies ModePreference,
            label: t('appearance.modeSystem'),
            icon: 'cellphone-cog',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
});
