/**
 * Fontes custom do BebeCare.
 *
 * Marca + titulos -> Nunito (arredondada, calorosa, conversa com o logo).
 * Corpo + UI      -> Inter  (legibilidade alta em telas densas/formularios).
 *
 * Os .ttf vivem em assets/fonts (fonte da verdade) e, pro Android, tambem em
 * android/app/src/main/assets/fonts. No Android o `fontFamily` casa com o NOME
 * DO ARQUIVO (sem extensao) — por isso usamos 'Nunito_700Bold' etc.
 *
 * IMPORTANTE (Android): quando o fontFamily ja codifica o peso (ex.: _700Bold),
 * deixamos fontWeight: 'normal' pra evitar que o RN tente "sintetizar" um peso
 * e acabe caindo no fallback. O peso visual vem da escolha do arquivo.
 *
 * O merge do configureFonts preserva fontSize/lineHeight/letterSpacing do MD3 —
 * aqui so trocamos a familia por variante.
 */

import { configureFonts } from 'react-native-paper';

/** Nomes das familias (= nome do .ttf, sem extensao). */
export const fontFamilies = {
  /** Nunito ExtraBold — wordmark da marca e display. */
  brand: 'Nunito_800ExtraBold',
  /** Nunito Bold — headlines e titulos. */
  heading: 'Nunito_700Bold',
  /** Nunito SemiBold — titulos menores. */
  headingSoft: 'Nunito_600SemiBold',
  /** Inter Regular — corpo de texto. */
  body: 'Inter_400Regular',
  /** Inter Medium — labels menores. */
  bodyMedium: 'Inter_500Medium',
  /** Inter SemiBold — botoes e labels de destaque. */
  bodyStrong: 'Inter_600SemiBold',
  /** Inter Bold — enfase pontual no corpo. */
  bodyBold: 'Inter_700Bold',
} as const;

/** Helper: familia + peso 'normal' (peso real vem do arquivo). */
const family = (fontFamily: string) =>
  ({ fontFamily, fontWeight: 'normal' as const });

/** Config por-variante MD3 — merge preserva os tamanhos padrao. */
export const fontConfig = {
  displayLarge: family(fontFamilies.brand),
  displayMedium: family(fontFamilies.brand),
  displaySmall: family(fontFamilies.brand),

  headlineLarge: family(fontFamilies.heading),
  headlineMedium: family(fontFamilies.heading),
  headlineSmall: family(fontFamilies.heading),

  titleLarge: family(fontFamilies.heading),
  titleMedium: family(fontFamilies.heading),
  titleSmall: family(fontFamilies.headingSoft),

  bodyLarge: family(fontFamilies.body),
  bodyMedium: family(fontFamilies.body),
  bodySmall: family(fontFamilies.body),

  labelLarge: family(fontFamilies.bodyStrong),
  labelMedium: family(fontFamilies.bodyMedium),
  labelSmall: family(fontFamilies.bodyMedium),
} as const;

/** Typescale MD3 ja com as fontes custom aplicadas. */
export const appFonts = configureFonts({ config: fontConfig });
