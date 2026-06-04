/**
 * Botao primario de submit com loading e disabled-aware.
 *
 * Encapsula o padrao: `<Button loading={isSubmitting} disabled={isSubmitting || !isValid}>`.
 * Quando loading=true, o Paper já desabilita o press, mas ainda renderiza
 * o label — passamos label explicito porque alguns forms querem trocar o
 * texto (ex.: "Entrando..." em vez de spinner).
 */

import { StyleSheet } from 'react-native';
import { Button, type ButtonProps } from 'react-native-paper';

type SubmitButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
} & Omit<ButtonProps, 'mode' | 'children' | 'onPress'>;

export function SubmitButton({
  loading,
  disabled,
  onPress,
  children,
  style,
  ...rest
}: SubmitButtonProps) {
  return (
    <Button
      {...rest}
      mode="contained"
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      style={[styles.button, style]}
      contentStyle={styles.content}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginTop: 8,
  },
  content: {
    paddingVertical: 6,
  },
});
