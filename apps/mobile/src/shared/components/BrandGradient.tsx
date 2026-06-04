/**
 * Faixa com o gradiente da marca (azul -> rosa).
 *
 * Usa react-native-svg (ja nativo no projeto) — sem dependencia nova.
 * Preenche o container; passe `style` pra definir tamanho/cantos e coloque
 * o conteudo como children (ex.: logo branco + tagline).
 *
 * Uso pontual: so em superficies de MARCA (hero do Login, splash, onboarding).
 * No resto do app continue usando as cores solidas do tema.
 */

import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BRAND_BLUE, BRAND_PINK } from './Logo';

export function BrandGradient({ style, children, ...rest }: ViewProps) {
  return (
    <View style={style} {...rest}>
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={BRAND_BLUE} />
            <Stop offset="1" stopColor={BRAND_PINK} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#brandGrad)" />
      </Svg>
      {children}
    </View>
  );
}
