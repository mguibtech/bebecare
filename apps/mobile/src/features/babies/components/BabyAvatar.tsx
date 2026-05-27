/**
 * Avatar do bebe via DiceBear PNG (mesma origem do user).
 *
 * Reutilizavel em:
 *  - Home header (size grande)
 *  - SelectorSheet (size medio)
 *  - DetailScreen (size grande)
 *
 * Aceita `style + seed` direto OU `baby` object (conveniencia).
 */

import { Avatar } from 'react-native-paper';

import type { Baby } from '../types';
import { AvatarStyle } from '../types';

type BabyAvatarProps = {
  size: number;
  /** Se passar baby, ignora style/seed. */
  baby?: Pick<Baby, 'avatarStyle' | 'avatarSeed' | 'name'>;
  style?: AvatarStyle;
  seed?: string;
};

const DEFAULT_STYLE = AvatarStyle.LORELEI;
const DEFAULT_SEED = 'baby';

export function BabyAvatar({ size, baby, style, seed }: BabyAvatarProps) {
  const effectiveStyle = baby?.avatarStyle ?? style ?? DEFAULT_STYLE;
  const effectiveSeed = baby?.avatarSeed ?? seed ?? DEFAULT_SEED;
  const uri = `https://api.dicebear.com/9.x/${effectiveStyle}/png?seed=${encodeURIComponent(effectiveSeed)}`;
  return <Avatar.Image size={size} source={{ uri }} />;
}
