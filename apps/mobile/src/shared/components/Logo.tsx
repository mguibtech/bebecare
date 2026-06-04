/**
 * Logo do BebeCare — marca oficial (dois pezinhos formando um coracao).
 *
 * Pe esquerdo azul + pe direito rosa = a historia da marca (casal cuidando
 * junto / menino+menina) e o gradiente azul->rosa escolhido como identidade.
 *
 * Variantes:
 *  - "mark"  -> so o simbolo (tab bar, splash, empty states, avatar fallback)
 *  - "full"  -> simbolo + wordmark "BebeCare" (Login, onboarding, headers)
 *
 * Props:
 *  - size  -> altura do simbolo em px (default 96)
 *  - mono  -> se passado, desenha os dois pes nessa unica cor (ex.: "#fff"
 *             sobre fundo gradiente/colorido). Sem mono = duas cores da marca.
 *
 * Obs.: a wordmark usa Paper Text; quando a fonte Nunito entrar (fase D-2)
 * ela herda automaticamente o peso arredondado da marca.
 */

import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import type { AppTheme } from '@/app/theme';

/** Cores oficiais da marca. */
export const BRAND_BLUE = '#5B9BD5';
export const BRAND_PINK = '#F4A6B8';

type LogoVariant = 'mark' | 'full';

export type LogoProps = {
  /** Altura do simbolo em px. Default 96. */
  size?: number;
  /** "mark" (so simbolo) ou "full" (simbolo + texto). Default "mark". */
  variant?: LogoVariant;
  /** Cor unica para ambos os pes (ex.: "#fff" sobre fundo colorido). */
  mono?: string;
};

/** So o simbolo (dois pezinhos). */
export function LogoMark({ size = 96, mono }: Pick<LogoProps, 'size' | 'mono'>) {
  const left = mono ?? BRAND_BLUE;
  const right = mono ?? BRAND_PINK;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* pe esquerdo */}
      <G fill={left}>
        <Ellipse cx={39} cy={56} rx={15} ry={21} origin="39, 56" rotation={-24} />
        <Circle cx={20} cy={30} r={5.2} />
        <Circle cx={29} cy={24} r={4.3} />
        <Circle cx={38} cy={22} r={3.6} />
      </G>
      {/* pe direito */}
      <G fill={right}>
        <Ellipse cx={61} cy={56} rx={15} ry={21} origin="61, 56" rotation={24} />
        <Circle cx={80} cy={30} r={5.2} />
        <Circle cx={71} cy={24} r={4.3} />
        <Circle cx={62} cy={22} r={3.6} />
      </G>
    </Svg>
  );
}

/** Logo completo: simbolo + variante. */
export function Logo({ size = 96, variant = 'mark', mono }: LogoProps) {
  const theme = useTheme<AppTheme>();

  if (variant === 'mark') {
    return <LogoMark size={size} mono={mono} />;
  }

  const fontSize = Math.round(size * 0.42);
  const textColor = mono ?? theme.colors.onBackground;

  return (
    <View style={styles.row}>
      <LogoMark size={size} mono={mono} />
      <Text style={[styles.wordmark, { fontSize, color: textColor }]}>
        <Text style={[styles.wordmark, { fontSize, color: textColor }, styles.bold]}>
          Bebe
        </Text>
        Care
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontWeight: '600',
    letterSpacing: -0.5,
    marginLeft: 8,
  },
  bold: {
    fontWeight: '800',
    marginLeft: 0,
  },
});
