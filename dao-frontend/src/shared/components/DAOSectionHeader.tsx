import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/theme';
import { DAOText } from './DAOText';

export function DAOSectionHeader({ title, subtitle, onViewAll, padded = true }: { title: string; subtitle?: string; onViewAll?: () => void; padded?: boolean }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: padded ? spacing.gutter : 0, marginBottom: spacing.md }}>
      <View style={{ flex: 1 }}>
        <DAOText variant="heading" accessibilityRole="header">{title}</DAOText>
        {subtitle ? <DAOText variant="caption" tone="textMuted" italic>{subtitle}</DAOText> : null}
      </View>
      {onViewAll ? (
        <Pressable accessibilityRole="link" onPress={onViewAll} hitSlop={10}>
          <DAOText variant="bodySmall" tone="textMuted">{t('common.viewAll')}</DAOText>
        </Pressable>
      ) : null}
    </View>
  );
}
