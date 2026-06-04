/**
 * Picker do tempo de antecedencia do lembrete (Menu Paper).
 *
 * Opções: 30m, 1h, 3h, 1d, 1sem.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { REMINDER_OPTIONS } from '../types';

type ReminderPickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label?: string;
};

/** value (minutos) -> chave i18n da opcao. */
const OPTION_KEY = {
  30: 'appointments.reminderOpt30',
  60: 'appointments.reminderOpt60',
  180: 'appointments.reminderOpt180',
  1440: 'appointments.reminderOpt1440',
  10080: 'appointments.reminderOpt10080',
} as const;

export function ReminderPicker<TForm extends FieldValues>({
  control,
  name,
  label,
}: ReminderPickerProps<TForm>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const fieldLabel = label ?? t('appointments.reminderWhen');

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const optValue = (REMINDER_OPTIONS.find((o) => o.value === value)
          ?.value ?? 1440) as keyof typeof OPTION_KEY; // default 1 dia
        const display = t(OPTION_KEY[optValue]);

        return (
          <View style={styles.wrapper}>
            <Menu
              visible={visible}
              onDismiss={() => setVisible(false)}
              anchor={
                <Pressable onPress={() => setVisible(true)}>
                  <View pointerEvents="box-only">
                    <TextInput
                      mode="outlined"
                      label={fieldLabel}
                      value={display}
                      editable={false}
                      right={
                        <TextInput.Icon
                          icon="menu-down"
                          forceTextInputFocus={false}
                          onPress={() => setVisible(true)}
                        />
                      }
                    />
                  </View>
                </Pressable>
              }
            >
              {REMINDER_OPTIONS.map((opt) => (
                <Menu.Item
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setVisible(false);
                  }}
                  title={t(OPTION_KEY[opt.value])}
                />
              ))}
            </Menu>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
});
