/**
 * Picker da unidade de dose (Menu Paper) — 5 opcoes do enum DoseUnit.
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

import { DoseUnit, DOSE_UNIT_LABELS } from '../types';

type DoseUnitPickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label?: string;
};

const ALL_UNITS = Object.values(DoseUnit);

export function DoseUnitPicker<TForm extends FieldValues>({
  control,
  name,
  label = 'Unidade',
}: DoseUnitPickerProps<TForm>) {
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const display = value
          ? DOSE_UNIT_LABELS[value as DoseUnit]
          : '';

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
                      placeholder="Escolher"
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
              {ALL_UNITS.map((unit) => (
                <Menu.Item
                  key={unit}
                  onPress={() => {
                    onChange(unit);
                    setVisible(false);
                  }}
                  title={DOSE_UNIT_LABELS[unit]}
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
