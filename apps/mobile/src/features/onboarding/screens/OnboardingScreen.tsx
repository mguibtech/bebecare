/**
 * Onboarding — 4 slides mostrados 1x na primeira abertura (antes do Login).
 *
 * Paginacao horizontal (swipe) + dots + botoes "Pular" / "Próximo" / "Comecar".
 * Ao concluir/pular, marca seen=true (MMKV) e o RootNavigator troca pro Login.
 *
 * Não usa React Navigation — e' renderizado direto pelo RootNavigator como
 * "gate" entre booting e a stack pública.
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import { OnboardingIllustration } from '../components/OnboardingIllustration';
import { useOnboardingStore } from '../store/onboarding.store';

type Slide = {
  key: string;
  icon: 'logo' | string;
  title: string;
  body: string;
};

/** Metadados fixos dos slides; titulo/corpo vem do i18n em runtime. */
const SLIDE_META: { key: string; icon: 'logo' | string }[] = [
  { key: 'welcome', icon: 'logo' },
  { key: 'health', icon: 'needle' },
  { key: 'routine', icon: 'weather-night' },
  { key: 'couple', icon: 'account-multiple-outline' },
];

export function OnboardingScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const complete = useOnboardingStore((s) => s.complete);

  const SLIDES: Slide[] = SLIDE_META.map((m) => ({
    ...m,
    title: t(`onboarding.${m.key}Title` as 'onboarding.welcomeTitle'),
    body: t(`onboarding.${m.key}Body` as 'onboarding.welcomeBody'),
  }));

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setIndex(i);
    }
  };

  const next = () => {
    if (isLast) {
      complete();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      edges={['top', 'bottom']}
    >
      {/* Pular (some no último slide) */}
      <View style={styles.topBar}>
        {!isLast && (
          <Button mode="text" compact onPress={complete} textColor={theme.colors.primary}>
            {t('onboarding.skip')}
          </Button>
        )}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <OnboardingIllustration icon={slide.icon} size={Math.min(width * 0.6, 240)} />
            <Text variant="headlineSmall" style={styles.title}>
              {slide.title}
            </Text>
            <MutedText variant="bodyLarge" style={styles.body}>
              {slide.body}
            </MutedText>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              i === index && styles.dotActive,
              {
                backgroundColor:
                  i === index ? theme.colors.primary : theme.colors.outline,
              },
            ]}
          />
        ))}
      </View>

      {/* Acao */}
      <View style={styles.footer}>
        <Button mode="contained" onPress={next} style={styles.cta}>
          {isLast ? t('onboarding.start') : t('onboarding.next')}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 40,
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  cta: {
    paddingVertical: 4,
  },
});
