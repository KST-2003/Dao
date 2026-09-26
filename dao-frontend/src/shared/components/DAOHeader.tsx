import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { DAOIconButton } from './DAOIconButton';
import { DAOText } from './DAOText';

interface Props {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  large?: boolean;
  transparent?: boolean;
}

export function DAOHeader({ title, back = true, right, large, transparent }: Props) {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + spacing.xs, paddingHorizontal: spacing.gutter, paddingBottom: spacing.sm, backgroundColor: transparent ? 'transparent' : colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
        {back ? (
          <DAOIconButton icon="chevron-left" tone="plain" accessibilityLabel={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ marginLeft: -spacing.sm }} />
        ) : null}
        {!large && title ? (
          <DAOText variant="heading" numberOfLines={1} style={{ flex: 1, marginLeft: back ? spacing.xs : 0 }} accessibilityRole="header">
            {title}
          </DAOText>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>{right}</View>
      </View>
      {large && title ? (
        <DAOText variant="display" accessibilityRole="header" style={{ marginTop: spacing.xs }}>
          {title}
        </DAOText>
      ) : null}
    </View>
  );
}
