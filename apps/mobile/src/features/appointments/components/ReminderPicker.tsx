/**
 * Picker do tempo de antecedencia do lembrete (Menu Paper).
 *
 * Opções: 30m, 1h, 3h, 1d, 1sem.
 */

import { useState } from 'react';
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

export function ReminderPicker<TForm extends FieldValues>({
  control,
  name,
  label = 'Quando avisar',
}: ReminderPickerProps<TForm>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const display =
          REMINDER_OPTIONS.find((o) => o.value === value)?.label ??
          REMINDER_OPTIONS[3].label; // default 1 dia

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
                      label={label}
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
                  title={opt.label}
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
