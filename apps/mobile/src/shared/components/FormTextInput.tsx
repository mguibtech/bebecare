/**
 * Wrapper sobre Paper TextInput integrado ao react-hook-form via Controller.
 *
 * Por que existe:
 * - Centraliza a integracao react-hook-form ↔ Paper (control, errors, ref).
 * - Garante visual consistente (HelperText abaixo, error visible quando dirty).
 * - Evita repetir 15 linhas de boilerplate em cada form.
 *
 * Uso:
 *   <FormTextInput
 *     control={control}
 *     name="email"
 *     label="Email"
 *     keyboardType="email-address"
 *     autoCapitalize="none"
 *   />
 */

import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

type FormTextInputProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  /** Forca esconder a HelperText mesmo sem erro (deixa o layout compacto). */
  hideHelperWhenValid?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

export function FormTextInput<TForm extends FieldValues>({
  control,
  name,
  label,
  hideHelperWhenValid,
  ...rest
}: FormTextInputProps<TForm>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value, ref }, fieldState }) => {
        const showError = Boolean(fieldState.error?.message);
        return (
          <View style={styles.wrapper}>
            <TextInput
              {...rest}
              ref={ref}
              mode="outlined"
              label={label}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={showError}
            />
            {(!hideHelperWhenValid || showError) && (
              <HelperText type="error" visible={showError}>
                {fieldState.error?.message ?? ' '}
              </HelperText>
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
