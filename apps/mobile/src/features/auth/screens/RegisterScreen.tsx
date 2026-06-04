/**
 * Tela de cadastro.
 *
 * Aceita inviteCode opcional — se informado, o backend insere o usuário
 * na família existente em vez de criar uma nova família solo.
 *
 * Em sucesso, useRegister.onSuccess salva tokens e o RootNavigator
 * troca pra AppStack sozinho.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
            ? t('auth.err409')
            : err.status === 400 && /convite/i.test(err.message)
              ? t('auth.errInvite')
              : err.message
          : t('auth.errGeneric');
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
              {t('auth.registerTagline')}
            </Text>
          </SafeAreaView>
        </BrandGradient>

        <View style={styles.form}>
          <Text variant="titleLarge" style={styles.formTitle}>
            {t('auth.registerTitle')}
          </Text>
          <MutedText variant="bodyMedium" style={styles.formSubtitle}>
            {t('auth.registerSubtitle')}
          </MutedText>

          <FormInput
            control={control}
            name="name"
            label={t('auth.nameLabel')}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />
        <FormInput
          control={control}
          name="email"
          label={t('common.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <FormPassword
          control={control}
          name="password"
          label={t('auth.passwordNewLabel')}
          isNew
        />
        <FormInput
          control={control}
          name="inviteCode"
          label={t('auth.inviteLabel')}
          keyboardType="number-pad"
          maxLength={6}
          autoCapitalize="none"
        />

        <SubmitButton
          onPress={onSubmit}
          loading={register.isPending}
          disabled={!formState.isValid && formState.isSubmitted}
        >
          {register.isPending ? t('auth.creating') : t('auth.createAccount')}
        </SubmitButton>

          <View style={styles.footer}>
            <MutedText variant="bodyMedium">{t('auth.hasAccount')}</MutedText>
            <Text
              variant="bodyMedium"
              style={[styles.link, { color: theme.colors.primary }]}
              onPress={() => navigation.navigate('Login')}
            >
              {t('auth.signIn')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={errorBanner !== null}
        onDismiss={() => setErrorBanner(null)}
        duration={4000}
        action={{ label: t('common.ok'), onPress: () => setErrorBanner(null) }}
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
