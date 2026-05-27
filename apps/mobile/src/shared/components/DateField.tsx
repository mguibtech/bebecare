/**
 * Campo de data integrado a react-hook-form via Controller.
 *
 * Visual: Paper TextInput readonly que abre o @react-native-community/datetimepicker
 * nativo ao tocar. Valor armazenado no form como string YYYY-MM-DD (formato
 * que o backend espera em DTOs).
 *
 * Por que TextInput readonly em vez do picker inline: o picker nativo eh modal
 * em ambas plataformas, e mostrar inline gastaria muito espaco vertical em
 * forms com varios campos.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

export type DateFieldProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  /** Limite inferior (default: sem limite). */
  minimumDate?: Date;
  /** Limite superior (default: hoje — usado pra birthDate). */
  maximumDate?: Date;
  /** Placeholder quando vazio. */
  placeholder?: string;
};

/** YYYY-MM-DD a partir de Date local (sem fuso). */
function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Date a partir de YYYY-MM-DD; null se invalida. */
function fromYmd(s: string | undefined | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return null;
  }
  const parsed = new Date(s + 'T00:00:00');
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Formata YYYY-MM-DD pra DD/MM/AAAA (pt-BR). */
function formatBr(s: string | undefined | null): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return '';
  }
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function DateField<TForm extends FieldValues>({
  control,
  name,
  label,
  minimumDate,
  maximumDate = new Date(),
  placeholder = 'DD/MM/AAAA',
}: DateFieldProps<TForm>) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState }) => {
        const showError = Boolean(fieldState.error?.message);
        const currentDate = fromYmd(value) ?? new Date();
        const display = formatBr(value);

        const handleChange = (
          event: DateTimePickerEvent,
          selectedDate: Date | undefined,
        ) => {
          // Android: picker fecha sozinho, evento type 'set' ou 'dismissed'.
          // iOS: picker fica aberto, fechamos manualmente.
          if (Platform.OS === 'android') {
            setPickerOpen(false);
          }
          if (event.type === 'set' && selectedDate) {
            onChange(toYmd(selectedDate));
          }
        };

        return (
          <View style={styles.wrapper}>
            <Pressable onPress={() => setPickerOpen(true)}>
              {/* pointerEvents=none no input pra Pressable receber o tap */}
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  label={label}
                  value={display}
                  placeholder={placeholder}
                  editable={false}
                  error={showError}
                  right={<TextInput.Icon icon="calendar" />}
                />
              </View>
            </Pressable>

            <HelperText type="error" visible={showError}>
              {fieldState.error?.message ?? ' '}
            </HelperText>

            {pickerOpen && (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handleChange}
              />
            )}
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
});
