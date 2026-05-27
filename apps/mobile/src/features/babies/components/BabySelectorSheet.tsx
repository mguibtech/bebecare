/**
 * Bottom sheet pra trocar o bebe selecionado.
 *
 * Acionado pelo tap no avatar/chip do bebe na Home. Mostra:
 *  - Lista de bebes da familia (com avatar + nome + idade)
 *  - Bebe ativo destacado
 *  - "Ver perfil" / "Editar" no bebe ativo
 *  - "+ Cadastrar bebe" no fim
 *
 * Implementacao: Modal portado do Paper (sem dep nova). Quando precisar
 * de gestos de swipe-to-dismiss, migrar pra @gorhom/bottom-sheet.
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AppStackParamList } from '@/app/navigation/types';
import type { AppTheme } from '@/app/theme';

import { BabyAvatar } from './BabyAvatar';
import { useBabies } from '../hooks/useBabies';
import { useBabySelectorStore } from '../store/baby-selector.store';
import type { Baby } from '../types';

type BabySelectorSheetProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Idade resumida pro sheet ("9 meses" ou "23 dias"). */
function formatAgeShort(b: Baby): string {
  if (b.ageMonths === 0) {
    return `${b.ageDays} dia${b.ageDays !== 1 ? 's' : ''}`;
  }
  return `${b.ageMonths} ${b.ageMonths === 1 ? 'mes' : 'meses'}`;
}

export function BabySelectorSheet({
  visible,
  onDismiss,
}: BabySelectorSheetProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const theme = useTheme<AppTheme>();

  const babies = useBabies();
  const selectedId = useBabySelectorStore((s) => s.selectedBabyId);
  const setSelected = useBabySelectorStore((s) => s.setSelected);

  const handleSelect = (id: string) => {
    setSelected(id);
    onDismiss();
  };

  const handleEdit = (id: string) => {
    onDismiss();
    navigation.navigate('BabyForm', { babyId: id });
  };

  const handleDetail = (id: string) => {
    onDismiss();
    navigation.navigate('BabyDetail', { babyId: id });
  };

  const handleCreate = () => {
    onDismiss();
    navigation.navigate('BabyForm', undefined);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.handle} />
        <Text variant="titleMedium" style={styles.title}>
          Bebes da familia
        </Text>

        <ScrollView style={styles.scroll}>
          {babies.data && babies.data.length > 0 ? (
            babies.data.map((b) => {
              const isActive = b.id === selectedId;
              return (
                <View key={b.id}>
                  <List.Item
                    title={b.name}
                    description={formatAgeShort(b)}
                    onPress={() => handleSelect(b.id)}
                    // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper precisa de closure no item do map
                    left={() => (
                      <View style={styles.avatarWrap}>
                        <BabyAvatar size={40} baby={b} />
                      </View>
                    )}
                    // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper precisa de closure no item do map
                    right={() => (
                      <View style={styles.actions}>
                        {isActive && (
                          <>
                            <IconButton
                              icon="account-details"
                              size={20}
                              accessibilityLabel="Ver perfil"
                              onPress={() => handleDetail(b.id)}
                            />
                            <IconButton
                              icon="pencil"
                              size={20}
                              accessibilityLabel="Editar"
                              onPress={() => handleEdit(b.id)}
                            />
                          </>
                        )}
                      </View>
                    )}
                    style={
                      isActive
                        ? { backgroundColor: theme.colors.primaryContainer }
                        : undefined
                    }
                  />
                  <Divider />
                </View>
              );
            })
          ) : (
            <Text variant="bodyMedium" style={styles.empty}>
              Nenhum bebe cadastrado ainda.
            </Text>
          )}
        </ScrollView>

        <Button
          mode="contained"
          icon="plus"
          onPress={handleCreate}
          style={styles.addButton}
        >
          Cadastrar bebe
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
    maxHeight: '80%',
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
    marginBottom: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    maxHeight: 320,
  },
  avatarWrap: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: 24,
  },
  addButton: {
    marginTop: 16,
  },
});
