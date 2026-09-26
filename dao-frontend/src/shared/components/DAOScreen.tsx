import type { PropsWithChildren, ReactElement } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme';
import { OfflineBanner } from './OfflineBanner';

interface Props {
  header?: ReactElement | null;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page shell: theme background, optional header/footer, offline banner, pull-to-refresh. */
export function DAOScreen({ header, scroll = true, padded = true, footer, refreshing, onRefresh, contentStyle, children }: PropsWithChildren<Props>) {
  const { colors, spacing } = useTheme();
  const inner: StyleProp<ViewStyle> = [padded && { paddingHorizontal: spacing.gutter }, { paddingBottom: spacing.huge }, contentStyle];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      <OfflineBanner />
      {scroll ? (
        <ScrollView
          contentContainerStyle={inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer}
    </View>
  );
}
