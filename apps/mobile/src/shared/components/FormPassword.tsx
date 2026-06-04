/**
 * FormPassword — variante de FormInput pra campos de senha.
 *
 * Diferencas em relacao a FormInput:
 * - `secureTextEntry` controlado por estado local (toggle do olho).
 * - Ícone a direita: 'eye' (mostrar) / 'eye-off' (esconder).
 * - autoCapitalize='none' e autoCorrect=false por default (overridable).
 * - autoComplete e textContentType apropriados pra senha por default.
 *
 * Uso:
 *   <FormPassword
 *     control={control}
 *     name="password"
 *     label="Senha"
 *   />
 *
 * Pra cadastro use `isNew` que ajusta o autoComplete pra 'password-new'
 * (faz iOS/Android não oferecerem senha existente).
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput, type TextInputProps } from 'react-native-paper';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

export type FormPasswordProps<TForm extends FieldValues> = {
  control: Control<TForm>;
  name: FieldPath<TForm>;
  label: string;
  /**
   * Se true, o autoComplete vira 'password-new' e textContentType 'newPassword'.
   * Use em telas de cadastro/reset; deixe false (default) em telas de login.
   */
  isNew?: boolean;
  /** Esconde a HelperText quando não ha erro. */
  hideHelperWhenValid?: boolean;
} & Omit<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'onBlur'
  | 'error'
  | 'secureTextEntry'
  | 'right'
  | 'autoComplete'
  | 'textContentType'
>;

export function FormPassword<TForm extends FieldValues>({
  control,
  name,
  label,
  isNew = false,
  hideHelperWhenValid,
  autoCapitalize = 'none',
  autoCorrect = false,
  ...rest
}: FormPasswordProps<TForm>) {
  const [visible, setVisible] = useState(false);

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
              secureTextEntry={!visible}
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              autoComplete={isNew ? 'password-new' : 'password'}
              textContentType={isNew ? 'newPassword' : 'password'}
              right={
                <TextInput.Icon
                  icon={visible ? 'eye-off' : 'eye'}
                  onPress={() => setVisible((v) => !v)}
                  // accessibilityLabel ajuda screen readers
                  accessibilityLabel={
                    visible ? 'Esconder senha' : 'Mostrar senha'
                  }
                  forceTextInputFocus={false}
                />
              }
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
