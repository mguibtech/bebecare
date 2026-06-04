/**
 * Campo de data integrado a react-hook-form via Controller.
 *
 * Estrategia de abrir o picker:
 *  - Android: API imperativa `DateTimePickerAndroid.open()` — abre o picker
 *    nativo direto, fora da arvore de render. Funciona dentro de Modal/Portal
 *    do Paper (onde o componente declarativo se perde).
 *  - iOS: picker componente inline (display='spinner') — UX padrao do iOS.
 *
 * Valor armazenado no form como YYYY-MM-DD (formato que o backend espera).
 * Visual: Paper TextInput readonly com ícone de calendário clicavel.
 */

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import DateTimePicker, {
  DateTimePickerAndroid,
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
  /**
   * Limite superior (default: sem limite). Telas que não podem ter data futura
   * (nascimento do bebê, data de aplicacao de vacina) passam `new Date()`
   * explicitamente. Datas de tratamento (remédio) ficam sem limite.
   */
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

/** Date a partir de YYYY-MM-DD; null se inválida. */
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
  maximumDate,
  placeholder = 'DD/MM/AAAA',
}: DateFieldProps<TForm>) {
  // Estado do picker SOH usado em iOS (Android usa API imperativa).
  const [pickerOpenIOS, setPickerOpenIOS] = useState(false);

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
          // iOS: picker fica aberto, fechamos manualmente.
          // Android: API imperativa já fecha sozinho; este callback recebe
          // type 'set' (user confirmou) ou 'dismissed' (user cancelou).
          if (Platform.OS === 'ios') {
            // iOS spinner não fecha automatico — fechamos so se não for change continuo
            // (deixa o user rolar a roda sem fechar a cada tick).
          }
          if (event.type === 'set' && selectedDate) {
            onChange(toYmd(selectedDate));
          }
        };

        /**
         * Abrir picker. Android = imperativo (funciona em Modal).
         * iOS = setState que renderiza o componente inline.
         */
        const openPicker = () => {
          if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
              value: currentDate,
              mode: 'date',
              onChange: handleChange,
              maximumDate,
              minimumDate,
            });
          } else {
            setPickerOpenIOS(true);
          }
        };

        return (
          <View style={styles.wrapper}>
            <Pressable onPress={openPicker} style={styles.pressable}>
              <View pointerEvents="box-only">
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

            {/* iOS: picker inline. Android não renderiza nada — usa API imperativa. */}
            {Platform.OS === 'ios' && pickerOpenIOS && (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={(event, selectedDate) => {
                  handleChange(event, selectedDate);
                  if (event.type === 'set' || event.type === 'dismissed') {
                    setPickerOpenIOS(false);
                  }
                }}
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
  pressable: {
    // Sem flex/padding aqui — o TextInput dimensiona o tamanho.
  },
});
