/**
 * Picker da unidade de dose (Menu Paper) — 5 opções do enum DoseUnit.
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

import { DoseUnit, DOSE_UNIT_KEYS } from '../types';

type DoseUnitPickerProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label?: string;
};

const ALL_UNITS = Object.values(DoseUnit);

export function DoseUnitPicker<TForm extends FieldValues>({
  control,
  name,
  label,
}: DoseUnitPickerProps<TForm>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        const display = value
          ? t(DOSE_UNIT_KEYS[value as DoseUnit])
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
                      label={label ?? t('meds.unitLabel')}
                      value={display}
                      editable={false}
                      placeholder={t('meds.unitChoose')}
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
                  title={t(DOSE_UNIT_KEYS[unit])}
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
