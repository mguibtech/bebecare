/**
 * Ilustracao de um slide do onboarding: circulo com o gradiente da marca
 * e um motivo branco no centro (logo no slide 1, icone nos demais).
 *
 * Mantem coerencia visual com o logo/splash sem precisar de assets externos.
 * (Pode evoluir pra ilustracoes SVG mais ricas na fase de polimento.)
 */

import { StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';

import { BrandGradient, LogoMark } from '@/shared/components';

type OnboardingIllustrationProps = {
  /** Diametro do circulo. */
  size?: number;
  /** Se 'logo', mostra a marca; senao, o nome do icone MaterialCommunityIcons. */
  icon: 'logo' | string;
};

export function OnboardingIllustration({
  size = 200,
  icon,
}: OnboardingIllustrationProps) {
  return (
    <BrandGradient
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {icon === 'logo' ? (
        <LogoMark size={size * 0.5} mono="#FFFFFF" />
      ) : (
        <Icon source={icon} size={size * 0.46} color="#FFFFFF" />
      )}
    </BrandGradient>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
