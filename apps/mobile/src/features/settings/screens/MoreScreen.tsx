/**
 * Tab "Mais" — agrega features secundarias e configurações.
 *
 * Sections atuais:
 *  - Usuário (avatar, nome, email)
 *  - Família (membros + lugar futuro pra convidar)
 *  - Aparência (paleta + modo)
 *  - Sair
 *
 * Sera expandido com:
 *  - Diário (M9)
 *  - Receitas medicas (M7)
 *  - Lista de compras (M8)
 *  - "Sobre" / privacidade / suporte (M10)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Dialog,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useMe } from '@/features/auth/hooks/useMe';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useDeleteAccount } from '@/features/auth/hooks/useDeleteAccount';
import { ApiError } from '@/shared/api/types';
import { PalettePicker } from '@/features/settings/components/PalettePicker';
import { ModePicker } from '@/features/settings/components/ModePicker';
import { APP_VERSION, PRIVACY_URL, TERMS_URL } from '@/features/settings/constants';
import type { AppTheme } from '@/app/theme';
import type { AppStackParamList } from '@/app/navigation/types';

export function MoreScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const me = useMe();
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const containerStyle = { backgroundColor: theme.colors.background };

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    try {
      await deleteAccount.mutateAsync();
      // RootNavigator detecta signOut e troca pra AuthStack sozinho.
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('more.deleteError');
      setSnackbar(message);
    }
  };

  if (me.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (me.isError || !me.data) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <Text variant="bodyLarge" style={styles.errorTitle}>
          {t('common.loadErrorProfile')}
        </Text>
        <Text variant="bodySmall" style={[styles.muted, styles.errorSubtitle]}>
          {t('common.checkConnection')}
        </Text>
        <Button
          mode="contained"
          onPress={() => me.refetch()}
          loading={me.isFetching}
          style={styles.retryButton}
        >
          {t('common.retry')}
        </Button>
        <Button mode="text" onPress={() => logout.mutate()} loading={logout.isPending}>
          {t('common.signOut')}
        </Button>
      </SafeAreaView>
    );
  }

  const { user, family } = me.data;
  const userAvatarUrl = `https://api.dicebear.com/9.x/${user.avatarStyle}/png?seed=${encodeURIComponent(user.avatarSeed)}`;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
      {/* USUARIO — toca pra editar perfil */}
      <Pressable
        style={styles.userHeader}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Avatar.Image size={64} source={{ uri: userAvatarUrl }} />
        <View style={styles.userText}>
          <Text variant="titleMedium" style={styles.userName}>
            {user.name}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {user.email}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.chevron}>
          ›
        </Text>
      </Pressable>

      {/* FAMILIA — card botao que navega pra FamilyScreen */}
      <Pressable onPress={() => navigation.navigate('Family')}>
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title={family.name ?? t('family.defaultName')}
            subtitle={t('more.familySubtitle', {
              count: family.members.length + 1,
            })}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            left={() => (
              <Avatar.Icon
                size={40}
                icon="account-multiple"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            right={(props) => (
              <Text {...props} variant="bodySmall" style={styles.chevron}>
                ›
              </Text>
            )}
          />
        </Card>
      </Pressable>

      {/* DESPERTADORES (M7) */}
      <Pressable onPress={() => navigation.navigate('Alarms')}>
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title={t('more.alarmsTitle')}
            subtitle={t('more.alarmsSubtitle')}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            left={() => (
              <Avatar.Icon
                size={40}
                icon="alarm"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            right={(props) => (
              <Text {...props} variant="bodySmall" style={styles.chevron}>
                ›
              </Text>
            )}
          />
        </Card>
      </Pressable>

      {/* MODO SONINHO (B10) */}
      <Pressable onPress={() => navigation.navigate('Sleep')}>
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title={t('more.sleepTitle')}
            subtitle={t('more.sleepSubtitle')}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            left={() => (
              <Avatar.Icon
                size={40}
                icon="weather-night"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            right={(props) => (
              <Text {...props} variant="bodySmall" style={styles.chevron}>
                ›
              </Text>
            )}
          />
        </Card>
      </Pressable>

      {/* APARENCIA */}
      <Card style={styles.card} mode="outlined">
        <Card.Title title={t('more.appearanceTitle')} />
        <Card.Content>
          <Text variant="labelMedium" style={styles.settingsLabel}>
            {t('more.appearanceTheme')}
          </Text>
          <PalettePicker compact />

          <View style={styles.spacer} />

          <Text variant="labelMedium" style={styles.settingsLabel}>
            {t('more.appearanceMode')}
          </Text>
          <ModePicker />
        </Card.Content>
      </Card>

      {/* PERMISSOES */}
      <Pressable onPress={() => navigation.navigate('Permissions')}>
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title={t('more.permissionsTitle')}
            subtitle={t('more.permissionsSubtitle')}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            left={() => (
              <Avatar.Icon
                size={40}
                icon="shield-check-outline"
                style={{ backgroundColor: theme.colors.primaryContainer }}
              />
            )}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            right={(props) => (
              <Text {...props} variant="bodySmall" style={styles.chevron}>
                ›
              </Text>
            )}
          />
        </Card>
      </Pressable>

      <Text variant="bodySmall" style={styles.placeholder}>
        {t('more.comingSoon')}
      </Text>

      <Button
        mode="outlined"
        onPress={() => logout.mutate()}
        loading={logout.isPending}
        icon="logout"
        style={styles.signOut}
      >
        {t('common.signOut')}
      </Button>

      {/* EXCLUIR CONTA — destrutivo, fica visualmente apartado */}
      <View style={styles.dangerZone}>
        <Text variant="labelSmall" style={styles.dangerLabel}>
          {t('more.dangerZone')}
        </Text>
        <Button
          mode="text"
          onPress={() => setDeleteDialogOpen(true)}
          textColor={theme.colors.error}
          icon="trash-can-outline"
        >
          {t('more.deleteAccount')}
        </Button>
      </View>

      {/* SOBRE */}
      <View style={styles.about}>
        <Text variant="labelSmall" style={styles.muted}>
          {t('more.appVersion', { version: APP_VERSION })}
        </Text>
        <View style={styles.aboutLinks}>
          <Button
            mode="text"
            compact
            onPress={() => {
              Linking.openURL(PRIVACY_URL);
            }}
          >
            {t('more.privacy')}
          </Button>
          <Button
            mode="text"
            compact
            onPress={() => {
              Linking.openURL(TERMS_URL);
            }}
          >
            {t('more.terms')}
          </Button>
        </View>
      </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogOpen}
          onDismiss={() => setDeleteDialogOpen(false)}
        >
          <Dialog.Icon icon="alert-circle-outline" color={theme.colors.error} />
          <Dialog.Title style={styles.dialogTitle}>
            {t('more.deleteDialogTitle')}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              {t('more.deleteDialogIntro')}
            </Text>
            <Text variant="bodyMedium" style={styles.dialogBullet}>
              {'• '}
              {t('more.deleteBullet1')}
            </Text>
            <Text variant="bodyMedium" style={styles.dialogBullet}>
              {'• '}
              {t('more.deleteBullet2')}
            </Text>
            <Text variant="bodyMedium" style={styles.dialogBullet}>
              {'• '}
              {t('more.deleteBullet3')}
            </Text>
            <Text variant="bodyMedium" style={styles.dialogText}>
              {t('more.deleteDialogRecovery')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={handleDeleteAccount}
              textColor={theme.colors.error}
              loading={deleteAccount.isPending}
            >
              {t('more.deleteDialogTitle')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar !== null}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: t('common.ok'), onPress: () => setSnackbar(null) }}
      >
        {snackbar ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userText: { marginLeft: 12, flex: 1 },
  userName: { fontWeight: '700' },
  muted: { opacity: 0.7 },
  card: { marginBottom: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  memberName: { marginLeft: 12 },
  chevron: {
    fontSize: 24,
    opacity: 0.5,
    marginRight: 16,
  },
  settingsLabel: {
    opacity: 0.7,
    marginBottom: 8,
  },
  spacer: { height: 16 },
  placeholder: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 16,
  },
  signOut: { marginTop: 8 },
  dangerZone: {
    marginTop: 32,
    paddingTop: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  dangerLabel: {
    opacity: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogText: {
    marginBottom: 8,
  },
  dialogBullet: {
    marginLeft: 8,
    marginBottom: 4,
  },
  errorTitle: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSubtitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginBottom: 4,
  },
  about: {
    marginTop: 24,
    alignItems: 'center',
    gap: 2,
  },
  aboutLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
