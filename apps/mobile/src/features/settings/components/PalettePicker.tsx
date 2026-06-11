/**
 * Picker de paleta (rosa/azul) com SegmentedButtons do Paper.
 *
 * Componente "burro" — soh le do store e dispara setPalette. Pode ser usado
 * onde quiser: header da Home (M2), futuro SettingsScreen (M10), etc.
 *
 * Modo (light/dark) NAO eh exposto aqui: ele segue o sistema operacional
 * via useColorScheme. Se um dia quisermos override manual, esse picker
 * ganha um segundo grupo de botoes.
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { useThemeStore } from '@/app/theme/store';
import { type PaletteName } from '@/app/theme/tokens';

type PalettePickerProps = {
  /** Densidade compacta (header). Default false. */
  compact?: boolean;
};

export function PalettePicker({ compact }: PalettePickerProps) {
  const { t } = useTranslation();
  const palette = useThemeStore((s) => s.palette);
  const setPalette = useThemeStore((s) => s.setPalette);

  return (
    <View style={compact ? styles.compact : styles.normal}>
      <SegmentedButtons
        value={palette}
        onValueChange={(v) => setPalette(v as PaletteName)}
        buttons={[
          {
            value: 'azul' satisfies PaletteName,
            label: t('appearance.paletteAzul'),
            icon: 'water',
          },
          {
            value: 'rosa' satisfies PaletteName,
            label: t('appearance.paletteRosa'),
            icon: 'heart',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  normal: {
    width: '100%',
  },
  compact: {
    width: '100%',
  },
});
