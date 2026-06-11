/**
 * Picker de sexo do bebê — SegmentedButtons 2 opções.
 *
 * Integra com react-hook-form via Controller. Sexo eh OBRIGATORIO no DTO
 * do backend (curva OMS varia por sexo), entao o picker começa sem selecao
 * e o submit valida via zod.
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { HelperText, SegmentedButtons, Text } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Sex } from '../types';

type SexPickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
};

export function SexPicker<TForm extends FieldValues>({
  control,
  name,
}: SexPickerProps<TForm>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => {
        const showError = Boolean(fieldState.error?.message);
        return (
          <View style={styles.wrapper}>
            <Text variant="labelMedium" style={styles.label}>
              {t('babies.sexLabel')}
            </Text>
            <SegmentedButtons
              value={value ?? ''}
              onValueChange={onChange}
              buttons={[
                {
                  value: Sex.MALE,
                  label: t('babies.sexMale'),
                  icon: 'gender-male',
                },
                {
                  value: Sex.FEMALE,
                  label: t('babies.sexFemale'),
                  icon: 'gender-female',
                },
              ]}
            />
            <HelperText type="error" visible={showError}>
              {fieldState.error?.message ?? ' '}
            </HelperText>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    opacity: 0.7,
    marginBottom: 8,
  },
});
