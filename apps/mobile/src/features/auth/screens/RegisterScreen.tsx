/**
 * Tela de cadastro.
 *
 * Aceita inviteCode opcional — se informado, o backend insere o usuario
 * na familia existente em vez de criar uma nova familia solo.
 *
 * Em sucesso, useRegister.onSuccess salva tokens e o RootNavigator
 * troca pra AppStack sozinho.
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormTextInput, SubmitButton } from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AuthScreenProps } from '@/app/navigation/types';

import { useRegister } from '../hooks/useRegister';
import {
  registerSchema,
  type RegisterFormValues,
} from '../schemas/auth.schema';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { email: '', name: '', password: '', inviteCode: '' },
  });

  const register = useRegister();

  const onSubmit = handleSubmit(async (values) => {
    setErrorBanner(null);
    try {
      await register.mutateAsync({
        email: values.email,
        name: values.name,
        password: values.password,
        // inviteCode jah vem como undefined se vazio (transform no schema).
        inviteCode: values.inviteCode,
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 409
            ? 'Esse email ja esta cadastrado'
            : err.status === 400 && /convite/i.test(err.message)
              ? 'Codigo de convite invalido ou expirado'
              : err.message
          : 'Erro inesperado. Tente novamente.';
      setErrorBanner(message);
    }
  });

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Criar conta
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sua familia em um so lugar
        </Text>

        <FormTextInput
          control={control}
          name="name"
          label="Seu nome"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
        <FormTextInput
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormTextInput
          control={control}
          name="password"
          label="Senha (minimo 8 caracteres)"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          textContentType="newPassword"
        />
        <FormTextInput
          control={control}
          name="inviteCode"
          label="Codigo de convite (opcional)"
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
        />

        <SubmitButton
          onPress={onSubmit}
          loading={register.isPending}
          disabled={!formState.isValid && formState.isSubmitted}
        >
          {register.isPending ? 'Criando conta...' : 'Criar conta'}
        </SubmitButton>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>
            Ja tem conta?{' '}
          </Text>
          <Text
            variant="bodyMedium"
            style={styles.link}
            onPress={() => navigation.navigate('Login')}
          >
            Entrar
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={errorBanner !== null}
        onDismiss={() => setErrorBanner(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setErrorBanner(null) }}
      >
        {errorBanner ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    opacity: 0.7,
  },
  link: {
    fontWeight: '600',
  },
});
