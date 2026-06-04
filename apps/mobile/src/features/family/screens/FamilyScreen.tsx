/**
 * Tela da família — membros + convites + acoes.
 *
 * Acoes principais:
 *  - Renomear (Dialog com TextInput)
 *  - Gerar convite (cria + abre Share API com link bebecare://invite/CODE)
 *  - Revogar convite pendente
 *  - Sair da família (se 2+ membros — backend bloqueia se solo)
 *
 * Mostra avisos quando família esta no limite (4 membros).
 */

import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { ApiError } from '@/shared/api/types';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import {
  useFamily,
  useUpdateFamily,
  useCreateInvite,
  useRevokeInvite,
  useLeaveFamily,
} from '../hooks';
import { FamilyInviteStatus, type Invite } from '../types';

/** YYYY-MM-DD a partir de ISO date-time. */
function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Mensagem do convite a compartilhar (texto + link). */
function inviteMessage(code: string): string {
  return `Vamos cuidar do bebê juntos no BebeCare!\n\nUse o código ${code} ao criar sua conta — válido por 7 dias.\n\nLink direto: bebecare://invite/${code}`;
}

export function FamilyScreen({ navigation }: AppScreenProps<'Family'>) {
  const theme = useTheme<AppTheme>();
  const family = useFamily();
  const updateFamily = useUpdateFamily();
  const createInvite = useCreateInvite();
  const revokeInvite = useRevokeInvite();
  const leaveFamily = useLeaveFamily();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const containerStyle = { backgroundColor: theme.colors.background };

  if (family.isPending) {
    return (
      <View style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (family.isError || !family.data) {
    return (
      <View style={[styles.center, containerStyle]}>
        <Text variant="bodyLarge">Erro ao carregar família</Text>
        <Text variant="bodyMedium" style={styles.errorBody}>
          {family.error?.message ?? 'Tente voltar e abrir de novo.'}
        </Text>
        <Button mode="outlined" onPress={() => family.refetch()}>
          Tentar de novo
        </Button>
      </View>
    );
  }

  const data = family.data;
  const isAtCapacity = data.members.length >= data.maxMembers;
  const isSolo = data.members.length === 1;

  // --------- Acoes ---------
  const handleShare = async (code: string) => {
    try {
      await Share.share({
        message: inviteMessage(code),
      });
    } catch {
      // Usuário cancelou — sem feedback necessario.
    }
  };

  const handleCreate = async () => {
    try {
      const invite = await createInvite.mutateAsync();
      // Abre Share automatico assim que cria — fluxo "criar e enviar"
      await handleShare(invite.code);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível gerar convite.';
      setSnackbar(message);
    }
  };

  const handleRevoke = (invite: Invite) => {
    Alert.alert('Revogar convite', `Revogar o código ${invite.code}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revogar',
        style: 'destructive',
        onPress: async () => {
          try {
            await revokeInvite.mutateAsync(invite.id);
          } catch (err) {
            setSnackbar(
              err instanceof ApiError ? err.message : 'Erro ao revogar.',
            );
          }
        },
      },
    ]);
  };

  const handleOpenRename = () => {
    setRenameValue(data.name ?? '');
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    setRenameDialogOpen(false);
    try {
      await updateFamily.mutateAsync({
        name: renameValue.trim() === '' ? null : renameValue.trim(),
      });
    } catch (err) {
      setSnackbar(err instanceof ApiError ? err.message : 'Erro ao renomear.');
    }
  };

  const handleLeave = () => {
    Alert.alert(
      'Sair da família',
      'Você ira para uma nova família solo. Bebês ficam com quem permanece. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily.mutateAsync();
              navigation.goBack();
            } catch (err) {
              setSnackbar(
                err instanceof ApiError ? err.message : 'Erro ao sair.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* CABECALHO da família */}
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title={data.name ?? 'Minha família'}
            subtitle={`${data.members.length} de ${data.maxMembers} membros`}
            // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
            right={(props) => (
              <IconButton
                {...props}
                icon="pencil"
                accessibilityLabel="Renomear família"
                onPress={handleOpenRename}
              />
            )}
          />
        </Card>

        {/* MEMBROS */}
        <Card style={styles.card} mode="outlined">
          <Card.Title title="Membros" />
          <Card.Content style={styles.cardContentTight}>
            {data.members.map((m, idx) => (
              <View key={m.id}>
                <List.Item
                  title={m.name + (m.isMe ? ' (você)' : '')}
                  // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
                  left={() => (
                    <View style={styles.avatarWrap}>
                      <Avatar.Image
                        size={40}
                        source={{
                          uri: `https://api.dicebear.com/9.x/${m.avatarStyle}/png?seed=${encodeURIComponent(m.avatarSeed)}`,
                        }}
                      />
                    </View>
                  )}
                />
                {idx < data.members.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* CONVITES */}
        <Card style={styles.card} mode="outlined">
          <Card.Title
            title="Convites pendentes"
            subtitle={
              data.pendingInvites.length === 0
                ? 'Nenhum convite ativo'
                : `${data.pendingInvites.length} convite(s)`
            }
          />
          <Card.Content style={styles.cardContentTight}>
            {data.pendingInvites
              .filter((i) => i.status === FamilyInviteStatus.PENDING)
              .map((invite) => (
                <View key={invite.id} style={styles.inviteRow}>
                  <View style={styles.inviteInfo}>
                    <Text variant="titleMedium" style={styles.inviteCode}>
                      {invite.code}
                    </Text>
                    <Text variant="bodySmall" style={styles.muted}>
                      Expira em {formatExpiry(invite.expiresAt)} • Por {invite.createdByName}
                    </Text>
                  </View>
                  <IconButton
                    icon="share-variant"
                    accessibilityLabel="Compartilhar"
                    onPress={() => handleShare(invite.code)}
                  />
                  <IconButton
                    icon="close-circle-outline"
                    accessibilityLabel="Revogar"
                    onPress={() => handleRevoke(invite)}
                    iconColor={theme.colors.error}
                  />
                </View>
              ))}

            {isAtCapacity ? (
              <Text variant="bodySmall" style={styles.atCapacity}>
                Família no limite de {data.maxMembers} membros. Revogue
                convites pendentes ou aguarde alguem sair pra convidar mais.
              </Text>
            ) : (
              <Button
                mode="contained"
                icon="account-plus"
                onPress={handleCreate}
                loading={createInvite.isPending}
                style={styles.createInviteButton}
              >
                Gerar convite e compartilhar
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* SAIR DA FAMILIA */}
        {!isSolo && (
          <Button
            mode="text"
            icon="exit-to-app"
            textColor={theme.colors.error}
            onPress={handleLeave}
            loading={leaveFamily.isPending}
            style={styles.leaveButton}
          >
            Sair da família
          </Button>
        )}
      </ScrollView>

      {/* DIALOG: Renomear */}
      <Portal>
        <Dialog
          visible={renameDialogOpen}
          onDismiss={() => setRenameDialogOpen(false)}
        >
          <Dialog.Title>Nome da família</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Ex: Família Silva"
              maxLength={100}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogOpen(false)}>Cancelar</Button>
            <Button
              onPress={handleConfirmRename}
              loading={updateFamily.isPending}
            >
              Salvar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar !== null}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: 'OK', onPress: () => setSnackbar(null) }}
      >
        {snackbar ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: { marginBottom: 12 },
  cardContentTight: { paddingHorizontal: 0 },
  avatarWrap: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inviteInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  inviteCode: {
    fontWeight: '700',
    letterSpacing: 4,
  },
  muted: { opacity: 0.7 },
  atCapacity: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    opacity: 0.8,
    textAlign: 'center',
  },
  createInviteButton: {
    margin: 12,
  },
  leaveButton: {
    marginTop: 16,
    alignSelf: 'center',
  },
  errorBody: {
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 8,
  },
});
