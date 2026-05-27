/**
 * Tab "Mais" — agrega features secundarias e configuracoes.
 *
 * Sections atuais:
 *  - Usuario (avatar, nome, email)
 *  - Familia (membros + lugar futuro pra convidar)
 *  - Aparencia (paleta + modo)
 *  - Sair
 *
 * Sera expandido com:
 *  - Diario (M9)
 *  - Receitas medicas (M7)
 *  - Lista de compras (M8)
 *  - "Sobre" / privacidade / suporte (M10)
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMe } from '@/features/auth/hooks/useMe';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { PalettePicker } from '@/features/settings/components/PalettePicker';
import { ModePicker } from '@/features/settings/components/ModePicker';
import type { AppTheme } from '@/app/theme';

export function MoreScreen() {
  const theme = useTheme<AppTheme>();
  const me = useMe();
  const logout = useLogout();

  const containerStyle = { backgroundColor: theme.colors.background };

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
          Erro ao carregar perfil
        </Text>
        <Button mode="text" onPress={() => logout.mutate()} loading={logout.isPending}>
          Sair
        </Button>
      </SafeAreaView>
    );
  }

  const { user, family } = me.data;
  const userAvatarUrl = `https://api.dicebear.com/9.x/${user.avatarStyle}/png?seed=${encodeURIComponent(user.avatarSeed)}`;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
      {/* USUARIO */}
      <View style={styles.userHeader}>
        <Avatar.Image size={64} source={{ uri: userAvatarUrl }} />
        <View style={styles.userText}>
          <Text variant="titleMedium" style={styles.userName}>
            {user.name}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {user.email}
          </Text>
        </View>
      </View>

      {/* FAMILIA */}
      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={family.name ?? 'Minha familia'}
          subtitle={`${family.members.length + 1} membro${family.members.length + 1 > 1 ? 's' : ''}`}
        />
        <Card.Content>
          {family.members.length === 0 ? (
            <Text variant="bodyMedium" style={styles.muted}>
              Voce ainda nao convidou ninguem. Em breve dah pra compartilhar
              com parceiro(a) ou outros responsaveis.
            </Text>
          ) : (
            family.members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <Avatar.Image
                  size={32}
                  source={{
                    uri: `https://api.dicebear.com/9.x/${m.avatarStyle}/png?seed=${encodeURIComponent(m.avatarSeed)}`,
                  }}
                />
                <Text variant="bodyMedium" style={styles.memberName}>
                  {m.name}
                </Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* APARENCIA */}
      <Card style={styles.card} mode="outlined">
        <Card.Title title="Aparencia" />
        <Card.Content>
          <Text variant="labelMedium" style={styles.settingsLabel}>
            Tema
          </Text>
          <PalettePicker compact />

          <View style={styles.spacer} />

          <Text variant="labelMedium" style={styles.settingsLabel}>
            Modo
          </Text>
          <ModePicker />
        </Card.Content>
      </Card>

      <Text variant="bodySmall" style={styles.placeholder}>
        Em breve: diario, receitas medicas, lista de compras.
      </Text>

      <Button
        mode="outlined"
        onPress={() => logout.mutate()}
        loading={logout.isPending}
        icon="logout"
        style={styles.signOut}
      >
        Sair
      </Button>
      </ScrollView>
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
  errorTitle: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
});
