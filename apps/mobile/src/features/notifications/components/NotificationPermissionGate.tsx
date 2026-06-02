/**
 * Pre-prompt amigavel de permissao de notificacoes.
 *
 * Boas praticas de UX de push: NAO disparar o prompt nativo do SO de cara.
 * Primeiro explicamos o valor ("lembretes de remedio e consulta"); so quando o
 * usuario toca "Ativar" e que chamamos o prompt do sistema. Assim, se ele negar
 * o nativo, ainda da pra reabrir depois — e o "negar" nativo e definitivo.
 *
 * Quando aparece: uma unica vez por device, no primeiro acesso logado, se:
 *  - Firebase esta configurado (tem google-services.json), E
 *  - a permissao ainda esta 'undetermined', E
 *  - ainda nao perguntamos (flag em MMKV).
 *
 * Implementacao: Paper Modal portado (mesmo padrao do BabySelectorSheet, sem
 * dep nova). Renderiza null quando nao ha nada a pedir.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';

import { snackbar } from '@/shared/feedback';
import { kv } from '@/shared/storage/mmkv';
import type { AppTheme } from '@/app/theme';

import { isFirebaseConfigured } from '../lib/firebase';
import { syncFcmToken } from '../lib/syncToken';
import { askPermission, getPermissionStatus } from '../setup';

/** Flag MMKV: ja mostramos o pre-prompt neste device. */
const ASKED_KEY = 'notifications.permissionAsked';

export function NotificationPermissionGate() {
  const theme = useTheme<AppTheme>();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured() || kv.getBool(ASKED_KEY)) {
      return;
    }

    let active = true;
    (async () => {
      const status = await getPermissionStatus();
      if (active && status === 'undetermined') {
        setVisible(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    kv.setBool(ASKED_KEY, true);
    setVisible(false);
  };

  const handleEnable = async () => {
    close();
    const status = await askPermission();
    if (status === 'granted') {
      await syncFcmToken();
      snackbar.showSuccess('Notificacoes ativadas!');
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={close}
        contentContainerStyle={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.handle} />
        <Text variant="titleMedium" style={styles.title}>
          Ativar lembretes?
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          Receba avisos na hora certa do remedio do bebe e lembretes das
          proximas consultas. Voce pode desativar quando quiser.
        </Text>

        <Button
          mode="contained"
          icon="bell-ring-outline"
          onPress={handleEnable}
          style={styles.enable}
        >
          Ativar notificacoes
        </Button>
        <Button mode="text" onPress={close}>
          Agora nao
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  enable: {
    marginBottom: 4,
  },
});
