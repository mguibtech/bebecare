/**
 * Campo de Data + Hora integrado a react-hook-form via Controller.
 *
 * Layout: dois Pressables lado a lado (Data | Hora). Cada um abre seu picker
 * nativo via API imperativa (DateTimePickerAndroid.open) — mesma estrategia do
 * DateField, robusta dentro de Modal/Sheet do Paper.
 *
 * Valor armazenado no form como ISO 8601 com timezone:
 *   '2026-06-10T14:30:00.000Z'
 *
 * Backend (CreateAppointmentDto.scheduledAt) espera esse formato.
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

export type DateTimeFieldProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  labelDate?: string;
  labelTime?: string;
  /** Limite inferior. */
  minimumDate?: Date;
  /** Limite superior. */
  maximumDate?: Date;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateBr(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTimeBr(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Date a partir de ISO; fallback "agora" se inválido. */
function fromIso(s: string | undefined | null): Date {
  if (!s) return new Date();
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DateTimeField<TForm extends FieldValues>({
  control,
  name,
  labelDate = 'Data',
  labelTime = 'Hora',
  minimumDate,
  maximumDate,
}: DateTimeFieldProps<TForm>) {
  const [iosDateOpen, setIosDateOpen] = useState(false);
  const [iosTimeOpen, setIosTimeOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState }) => {
        const showError = Boolean(fieldState.error?.message);
        const currentDate = fromIso(value);
        const dateDisplay = value ? formatDateBr(currentDate) : '';
        const timeDisplay = value ? formatTimeBr(currentDate) : '';

        /** Atualiza somente a parte de data preservando hora. */
        const setDatePart = (next: Date) => {
          const merged = new Date(currentDate);
          merged.setFullYear(next.getFullYear());
          merged.setMonth(next.getMonth());
          merged.setDate(next.getDate());
          onChange(merged.toISOString());
        };

        /** Atualiza somente a parte de hora preservando data. */
        const setTimePart = (next: Date) => {
          const merged = new Date(currentDate);
          merged.setHours(next.getHours());
          merged.setMinutes(next.getMinutes());
          merged.setSeconds(0, 0);
          onChange(merged.toISOString());
        };

        const handleDateChange = (
          event: DateTimePickerEvent,
          selected: Date | undefined,
        ) => {
          if (event.type === 'set' && selected) setDatePart(selected);
        };

        const handleTimeChange = (
          event: DateTimePickerEvent,
          selected: Date | undefined,
        ) => {
          if (event.type === 'set' && selected) setTimePart(selected);
        };

        const openDate = () => {
          if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
              value: currentDate,
              mode: 'date',
              onChange: handleDateChange,
              maximumDate,
              minimumDate,
            });
          } else {
            setIosDateOpen(true);
          }
        };

        const openTime = () => {
          if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
              value: currentDate,
              mode: 'time',
              onChange: handleTimeChange,
              is24Hour: true,
            });
          } else {
            setIosTimeOpen(true);
          }
        };

        return (
          <View style={styles.wrapper}>
            <View style={styles.row}>
              {/* DATA — 2/3 da largura */}
              <View style={styles.dateCol}>
                <Pressable onPress={openDate}>
                  <View pointerEvents="box-only">
                    <TextInput
                      mode="outlined"
                      label={labelDate}
                      value={dateDisplay}
                      placeholder="DD/MM/AAAA"
                      editable={false}
                      error={showError}
                      right={
                        <TextInput.Icon
                          icon="calendar"
                          forceTextInputFocus={false}
                        />
                      }
                    />
                  </View>
                </Pressable>
              </View>

              {/* HORA — 1/3 */}
              <View style={styles.timeCol}>
                <Pressable onPress={openTime}>
                  <View pointerEvents="box-only">
                    <TextInput
                      mode="outlined"
                      label={labelTime}
                      value={timeDisplay}
                      placeholder="HH:MM"
                      editable={false}
                      error={showError}
                      right={
                        <TextInput.Icon
                          icon="clock-outline"
                          forceTextInputFocus={false}
                        />
                      }
                    />
                  </View>
                </Pressable>
              </View>
            </View>

            <HelperText type="error" visible={showError}>
              {fieldState.error?.message ?? ' '}
            </HelperText>

            {/* iOS: pickers inline. Android usa API imperativa. */}
            {Platform.OS === 'ios' && iosDateOpen && (
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={(event, selected) => {
                  handleDateChange(event, selected);
                  if (event.type === 'set' || event.type === 'dismissed') {
                    setIosDateOpen(false);
                  }
                }}
              />
            )}
            {Platform.OS === 'ios' && iosTimeOpen && (
              <DateTimePicker
                value={currentDate}
                mode="time"
                display="spinner"
                is24Hour={true}
                onChange={(event, selected) => {
                  handleTimeChange(event, selected);
                  if (event.type === 'set' || event.type === 'dismissed') {
                    setIosTimeOpen(false);
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
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCol: {
    flex: 2,
  },
  timeCol: {
    flex: 1,
  },
});
