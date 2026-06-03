/**
 * Editar perfil do usuario — nome + avatar DiceBear.
 *
 * Reusa o AvatarStylePicker do dominio babies (mesma UX do cadastro de bebe).
 * Obs: AvatarStyle existe duplicado (auth/types e babies/types) com valores
 * IDENTICOS (ambos espelham o enum do backend). Convertemos via valor string
 * na fronteira — sem risco, mesmas chaves.
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { BabyAvatar } from '@/features/babies/components/BabyAvatar';
import {
  AvatarStylePicker,
  randomSeed,
} from '@/features/babies/components/AvatarStylePicker';
import { AvatarStyle as BabyAvatarStyle } from '@/features/babies/types';
import { useMe } from '@/features/auth/hooks/useMe';
import { useUpdateProfile } from '@/features/auth/hooks/useUpdateProfile';
import { AvatarStyle } from '@/features/auth/types';
import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

export function EditProfileScreen({ navigation }: AppScreenProps<'EditProfile'>) {
  const theme = useTheme<AppTheme>();
  const me = useMe();
  const update = useUpdateProfile();

  const [name, setName] = useState('');
  const [style, setStyle] = useState<BabyAvatarStyle>(BabyAvatarStyle.LORELEI);
  const [seed, setSeed] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data) {
      setName(me.data.user.name);
      setStyle(me.data.user.avatarStyle as unknown as BabyAvatarStyle);
      setSeed(me.data.user.avatarSeed);
    }
  }, [me.data]);

  const onSave = async () => {
    if (name.trim().length < 2) {
      setError('Nome muito curto');
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({
        name: name.trim(),
        avatarStyle: style as unknown as AvatarStyle,
        avatarSeed: seed.trim() || name.trim().toLowerCase(),
      });
      navigation.goBack();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  };

  if (me.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.preview}>
          <BabyAvatar size={88} style={style} seed={seed || name || 'user'} />
        </View>

        <TextInput
          mode="outlined"
          label="Nome"
          value={name}
          onChangeText={setName}
          maxLength={120}
          autoCapitalize="words"
          error={Boolean(error) && name.trim().length < 2}
        />

        <View style={styles.pickerWrap}>
          <AvatarStylePicker
            value={style}
            seed={seed || name || 'user'}
            onChange={setStyle}
            onRegenerateSeed={() => setSeed(randomSeed())}
          />
        </View>

        {error && name.trim().length >= 2 && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <MutedText variant="bodySmall" style={styles.hint}>
          O avatar é gerado pelo DiceBear a partir do estilo e de uma “semente”.
          Sem foto, sem upload.
        </MutedText>

        <Button
          mode="contained"
          onPress={onSave}
          loading={update.isPending}
          disabled={update.isPending}
          style={styles.saveBtn}
        >
          Salvar
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerWrap: {
    marginTop: 16,
  },
  errorText: {
    marginTop: 4,
  },
  hint: {
    marginTop: 8,
    lineHeight: 20,
  },
  saveBtn: {
    marginTop: 24,
  },
});
