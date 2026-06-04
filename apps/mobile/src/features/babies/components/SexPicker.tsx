/**
 * Picker de sexo do bebê — SegmentedButtons 2 opções.
 *
 * Integra com react-hook-form via Controller. Sexo eh OBRIGATORIO no DTO
 * do backend (curva OMS varia por sexo), entao o picker começa sem selecao
 * e o submit valida via zod.
 */

import { StyleSheet, View } from 'react-native';
import { HelperText, SegmentedButtons, Text } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { Sex, SEX_LABELS } from '../types';

type SexPickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
};

export function SexPicker<TForm extends FieldValues>({
  control,
  name,
}: SexPickerProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => {
        const showError = Boolean(fieldState.error?.message);
        return (
          <View style={styles.wrapper}>
            <Text variant="labelMedium" style={styles.label}>
              Sexo
            </Text>
            <SegmentedButtons
              value={value ?? ''}
              onValueChange={onChange}
              buttons={[
                {
                  value: Sex.MALE,
                  label: SEX_LABELS[Sex.MALE],
                  icon: 'gender-male',
                },
                {
                  value: Sex.FEMALE,
                  label: SEX_LABELS[Sex.FEMALE],
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
