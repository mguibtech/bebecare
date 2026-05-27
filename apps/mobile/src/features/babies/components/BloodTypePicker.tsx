/**
 * Picker de tipo sanguineo (8 valores ABO+Rh) + opcao "nao sei".
 *
 * Visualmente: TextInput readonly que abre Menu do Paper com as opcoes.
 * "Nao sei" / "Nao informado" = valor undefined (campo opcional).
 *
 * Integra com react-hook-form via Controller.
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

import { BloodType, BLOOD_TYPE_LABELS } from '../types';

type BloodTypePickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label?: string;
};

const ALL_BLOOD_TYPES = Object.values(BloodType);

export function BloodTypePicker<TForm extends FieldValues>({
  control,
  name,
  label = 'Tipo sanguineo (opcional)',
}: BloodTypePickerProps<TForm>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const display =
          value && BLOOD_TYPE_LABELS[value as BloodType]
            ? BLOOD_TYPE_LABELS[value as BloodType]
            : 'Nao informado';

        return (
          <View style={styles.wrapper}>
            <Menu
              visible={visible}
              onDismiss={() => setVisible(false)}
              anchor={
                <Pressable onPress={() => setVisible(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      mode="outlined"
                      label={label}
                      value={display}
                      editable={false}
                      right={<TextInput.Icon icon="menu-down" />}
                    />
                  </View>
                </Pressable>
              }
            >
              <Menu.Item
                onPress={() => {
                  onChange(undefined);
                  setVisible(false);
                }}
                title="Nao informado"
              />
              {ALL_BLOOD_TYPES.map((bt) => (
                <Menu.Item
                  key={bt}
                  onPress={() => {
                    onChange(bt);
                    setVisible(false);
                  }}
                  title={BLOOD_TYPE_LABELS[bt]}
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
