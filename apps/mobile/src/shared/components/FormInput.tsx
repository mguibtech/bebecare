/**
 * FormInput — Paper TextInput integrado a react-hook-form via Controller,
 * pronto pra validacao zod (mensagens em PT-BR vem do schema).
 *
 * Recursos:
 * - Erro do field eh exibido em HelperText abaixo do input.
 * - Suporta todas as props do TextInput do Paper exceto value/onChange/onBlur/error,
 *   que sao gerenciados pelo Controller.
 * - `hideHelperWhenValid`: esconde a HelperText quando nao tem erro,
 *   compactando o layout. Util em forms densos.
 *
 * Uso:
 *   <FormInput
 *     control={control}
 *     name="email"
 *     label="Email"
 *     keyboardType="email-address"
 *     autoCapitalize="none"
 *   />
 *
 * Para campos de senha, prefira FormPassword (mesmo contrato + toggle olho).
 */

import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

export type FormInputProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  /** Esconde a HelperText quando nao ha erro (layout mais denso). */
  hideHelperWhenValid?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

export function FormInput<TForm extends FieldValues>({
  control,
  name,
  label,
  hideHelperWhenValid,
  ...rest
}: FormInputProps<TForm>) {
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
