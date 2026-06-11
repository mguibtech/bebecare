/**
 * Grid de 8 estilos DiceBear pra escolher avatar do bebê.
 *
 * Mostra preview de cada estilo usando a seed atual (geralmente o nome do bebê).
 * Tocar troca o estilo (atualiza o form). Estilo selecionado tem borda visivel.
 *
 * Também permite "regenerar seed" — botao que gera uma seed aleatoria,
 * util quando o nome resulta num avatar feio.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Button, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/app/theme';

import { AvatarStyle } from '../types';

const ALL_STYLES = Object.values(AvatarStyle);

/** Estilo do avatar -> chave i18n do label. */
const STYLE_KEY = {
  [AvatarStyle.ADVENTURER]: 'babies.avatarAdventurer',
  [AvatarStyle.LORELEI]: 'babies.avatarLorelei',
  [AvatarStyle.MICAH]: 'babies.avatarMicah',
  [AvatarStyle.PERSONAS]: 'babies.avatarPersonas',
  [AvatarStyle.NOTIONISTS]: 'babies.avatarNotionists',
  [AvatarStyle.AVATAAARS]: 'babies.avatarAvataaars',
  [AvatarStyle.BOTTTS]: 'babies.avatarBotts',
  [AvatarStyle.CROODLES]: 'babies.avatarCroodles',
} as const;

type AvatarStylePickerProps = {
  value: AvatarStyle;
  seed: string;
  onChange: (style: AvatarStyle) => void;
  onRegenerateSeed: () => void;
};

function urlFor(style: AvatarStyle, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(seed)}`;
}

/** Gera seed pseudoaleatoria (8 chars alfanumericos). */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function AvatarStylePicker({
  value,
  seed,
  onChange,
  onRegenerateSeed,
}: AvatarStylePickerProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      ALL_STYLES.map((s) => ({
        style: s,
        uri: urlFor(s, seed),
        label: t(STYLE_KEY[s]),
      })),
    [seed, t],
  );

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        {t('babies.avatarStyleLabel')}
      </Text>

      <View style={styles.grid}>
        {items.map(({ style, uri, label }) => {
          const selected = style === value;
          return (
            <Pressable
              key={style}
              onPress={() => onChange(style)}
              style={[
                styles.item,
                // eslint-disable-next-line react-native/no-inline-styles -- cores derivam de theme + estado, não cabe em StyleSheet.create
                {
                  borderColor: selected ? theme.colors.primary : 'transparent',
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
            >
              <Avatar.Image size={48} source={{ uri }} />
              <Text variant="labelSmall" style={styles.itemLabel}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        mode="text"
        onPress={onRegenerateSeed}
        icon="dice-multiple"
        style={styles.regenerate}
      >
        {t('babies.avatarRegenerate')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    opacity: 0.7,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  item: {
    width: '23%',
    minWidth: 72,
    aspectRatio: 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 6,
  },
  itemLabel: {
    marginTop: 4,
    fontSize: 10,
  },
  regenerate: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
});
