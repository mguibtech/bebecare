/**
 * Text com cor "muted" (token semantico do tema).
 *
 * Substitui o anti-pattern `style={{ opacity: 0.7 }}` espalhado pelo app.
 *
 * Vantagens:
 * - Coerencia em todo o app (mesmo "cinza" em qualquer lugar)
 * - Dark-safe (alpha aumenta automaticamente em dark pra preservar contraste)
 * - WCAG-correto: cor calculada pra atingir contraste minimo sobre surface
 *
 * Exemplos:
 *   <MutedText>14/10/2025</MutedText>
 *   <MutedText variant="bodySmall">Prevista pra 24/10/2025</MutedText>
 */

import { type ComponentProps } from 'react';
import { Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/app/theme';

type MutedTextProps = ComponentProps<typeof Text>;

export function MutedText({ style, ...rest }: MutedTextProps) {
  const theme = useTheme<AppTheme>();
  return (
    <Text {...rest} style={[{ color: theme.app.text.muted }, style]} />
  );
}
