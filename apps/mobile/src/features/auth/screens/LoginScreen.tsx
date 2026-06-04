/**
 * Tela de login real.
 *
 * Usa react-hook-form + zod (loginSchema) → useLogin (mutation).
 * Em sucesso, signIn salva tokens no Keychain e o RootNavigator
 * troca pra AppStack sozinho (reativo ao status do auth.store).
 *
 * Erros do backend chegam como ApiError pelo interceptor; exibimos a
 * `message` no banner topo (Snackbar do Paper). A maioria dos 401 aqui
 * significa "credenciais ruins" — o interceptor NAO dispara refresh em
 * /auth/login (AUTH_BYPASS_PATHS).
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

import { useLogin } from '../hooks/useLogin';
import {
  loginSchema,
  type LoginFormValues,
} from '../schemas/auth.schema';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const theme = useTheme<AppTheme>();

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const login = useLogin();

  const onSubmit = handleSubmit(async (values) => {
    setErrorBanner(null);
    try {
      await login.mutateAsync(values);
      // Sucesso: nao precisa navegar — RootNavigator troca pra AppStack
      // assim que o status do auth.store vira 'authenticated'.
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? 'Email ou senha invalidos'
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
              Tudo do seu bebe, num lugar so
            </Text>
          </SafeAreaView>
        </BrandGradient>

        {/* FORMULARIO */}
        <View style={styles.form}>
          <Text variant="titleLarge" style={styles.formTitle}>
            Entrar
          </Text>
          <MutedText variant="bodyMedium" style={styles.formSubtitle}>
            Bem-vindo de volta!
          </MutedText>

          <FormInput
            control={control}
            name="email"
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <FormPassword control={control} name="password" label="Senha" />

          <SubmitButton
            onPress={onSubmit}
            loading={login.isPending}
            disabled={!formState.isValid && formState.isSubmitted}
          >
            {login.isPending ? 'Entrando...' : 'Entrar'}
          </SubmitButton>

          <View style={styles.footer}>
            <MutedText variant="bodyMedium">Ainda nao tem conta? </MutedText>
            <Text
              variant="bodyMedium"
              style={[styles.link, { color: theme.colors.primary }]}
              onPress={() => navigation.navigate('Register')}
            >
              Cadastre-se
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
