/**
 * Home real do app autenticado.
 *
 * Mostra o usuario logado (via useMe) e a familia com os outros membros.
 * Por enquanto eh placeholder do dashboard — sera substituida ou expandida
 * nas proximas Ms (M3 adiciona seletor de bebe, M4 vacinas, etc).
 *
 * O botao "Sair" usa useLogout que:
 *  - tenta revogar refresh token no backend (best-effort)
 *  - limpa Keychain + auth.store
 *  - limpa cache do React Query
 *  - RootNavigator troca pra AuthStack ao ver status='unauthenticated'.
 */

import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Avatar, Button, Card, Text } from 'react-native-paper';

import { useMe } from '@/features/auth/hooks/useMe';
import { useLogout } from '@/features/auth/hooks/useLogout';

export function HomeScreen() {
  const me = useMe();
  const logout = useLogout();

  if (me.isPending) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (me.isError || !me.data) {
    // 401 ja foi tratado pelo interceptor (signOut → AuthStack).
    // Outros erros: mostra mensagem e botao "Sair" pra recuperar.
    return (
      <View style={[styles.container, styles.center]}>
        <Text variant="bodyLarge" style={styles.errorTitle}>
          Nao foi possivel carregar seu perfil
        </Text>
        <Text variant="bodyMedium" style={styles.errorBody}>
          {me.error?.message ?? 'Erro desconhecido'}
        </Text>
        <Button
          mode="outlined"
          onPress={() => me.refetch()}
          style={styles.actionButton}
        >
          Tentar de novo
        </Button>
        <Button
          mode="text"
          onPress={() => logout.mutate()}
          loading={logout.isPending}
          style={styles.actionButton}
        >
          Sair
        </Button>
      </View>
    );
  }

  const { user, family } = me.data;
  const avatarUrl = `https://api.dicebear.com/9.x/${user.avatarStyle}/png?seed=${encodeURIComponent(user.avatarSeed)}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={72}
          source={{ uri: avatarUrl }}
          testID="me-avatar"
        />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.name}>
            Ola, {user.name}!
          </Text>
          <Text variant="bodyMedium" style={styles.email}>
            {user.email}
          </Text>
        </View>
      </View>

      <Card style={styles.card} mode="outlined">
        <Card.Title
          title={family.name ?? 'Minha familia'}
          subtitle={`${family.members.length + 1} membro${family.members.length + 1 > 1 ? 's' : ''}`}
        />
        <Card.Content>
          {family.members.length === 0 ? (
            <Text variant="bodyMedium" style={styles.muted}>
              Voce ainda nao convidou ninguem. Em breve da pra compartilhar com
              parceiro(a) ou outros responsaveis.
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

      <Text variant="bodySmall" style={styles.placeholder}>
        Em breve: bebe, vacinas, consultas, remedios.
      </Text>

      <Button
        mode="outlined"
        onPress={() => logout.mutate()}
        loading={logout.isPending}
        style={styles.signOut}
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: '700',
  },
  email: {
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  muted: {
    opacity: 0.7,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  memberName: {
    marginLeft: 12,
  },
  placeholder: {
    textAlign: 'center',
    opacity: 0.5,
    marginVertical: 24,
  },
  signOut: {
    marginTop: 'auto',
  },
  errorTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
    minWidth: 200,
  },
});
