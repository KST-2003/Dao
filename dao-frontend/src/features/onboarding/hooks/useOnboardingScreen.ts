import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePrefsStore } from '@/shared/store/prefsStore';

export interface Slide {
  key: string;
  title: string;
  body: string;
  tone: 'ivory' | 'sage' | 'rose' | 'midnight';
}

export function useOnboardingScreen(width: number) {
  const { t } = useTranslation();
  const complete = usePrefsStore((s) => s.completeOnboarding);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    { key: 'fashion', title: t('onboarding.fashionTitle'), body: t('onboarding.fashionBody'), tone: 'ivory' },
    { key: 'life', title: t('onboarding.lifeTitle'), body: t('onboarding.lifeBody'), tone: 'rose' },
    { key: 'kitchen', title: t('onboarding.kitchenTitle'), body: t('onboarding.kitchenBody'), tone: 'sage' },
    { key: 'members', title: t('onboarding.membersTitle'), body: t('onboarding.membersBody'), tone: 'midnight' },
  ];
  const isLast = index === slides.length - 1;

  const finish = () => {
    complete();
    router.replace('/(tabs)');
    router.push('/(auth)/login');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width)));
  };

  return { slides, index, isLast, listRef, next, skip: finish, onScrollEnd };
}
