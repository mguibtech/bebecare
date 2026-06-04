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
import { Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  BrandGradient,
  FormInput,
  FormPassword,
  Logo,
  MutedText,
  SubmitButton,
} from '@/shared/components';
import { ApiError } from '@/shared/api/types';
import type { AuthScreenProps } from '@/app/navigation/types';
import type { AppTheme } from '@/app/theme';

import { useRegister } from '../hooks/useRegister';
import {
  registerSchema,
  type RegisterFormValues,
} from '../schemas/auth.schema';

export function RegisterScreen({ navigation, route }: AuthScreenProps<'Register'>) {
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const theme = useTheme<AppTheme>();

  // Vem de deep link `bebecare://invite/:code` → pre-preenche o campo.
  const incomingInviteCode = route.params?.inviteCode ?? '';

  const { control, handleSubmit, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      name: '',
      password: '',
      inviteCode: incomingInviteCode,
    },
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
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO com gradiente da marca + logo branco */}
        <BrandGradient style={styles.hero}>
          <SafeAreaView edges={['top']} style={styles.heroInner}>
            <Logo variant="full" size={56} mono="#fff" />
            <Text variant="bodyLarge" style={styles.heroTagline}>
              Sua familia em um so lugar
            </Text>
          </SafeAreaView>
        </BrandGradient>

        <View style={styles.form}>
          <Text variant="titleLarge" style={styles.formTitle}>
            Criar conta
          </Text>
          <MutedText variant="bodyMedium" style={styles.formSubtitle}>
            E rapidinho, prometo!
          </MutedText>

          <FormInput
            control={control}
            name="name"
            label="Seu nome"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
        <FormInput
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormPassword
          control={control}
          name="password"
          label="Senha (minimo 8 caracteres)"
          isNew
        />
        <FormInput
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
            <MutedText variant="bodyMedium">Ja tem conta? </MutedText>
            <Text
              variant="bodyMedium"
              style={[styles.link, { color: theme.colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              Entrar
            </Text>
          </View>
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
  },
  hero: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroInner: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  heroTagline: {
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.95,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 32,
  },
  formTitle: {
    marginBottom: 2,
  },
  formSubtitle: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    fontWeight: '600',
  },
});
