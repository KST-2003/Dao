import { Feather } from '@expo/vector-icons';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOEmptyState, DAOErrorState, DAOHeader, DAOStar, DAOText, ListSkeleton } from '@/shared/components';
import { useLocale } from '@/shared/hooks/useLocale';
import { formatDate } from '@/shared/utils/format';
import { useTheme } from '@/shared/theme';
import type { NotificationType } from '@/types/enums';
import { useNotificationsScreen } from '../hooks/useNotificationsScreen';

const ICONS: Partial<Record<NotificationType, keyof typeof Feather.glyphMap>> = {
  order_update: 'package', new_drop: 'shopping-bag', new_vlog: 'play-circle', new_recipe: 'book-open', promotion: 'tag', vip_event: 'calendar',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { colors, spacing } = useTheme();
  const vm = useNotificationsScreen();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DAOHeader title={t('notifications.title')} right={vm.unread > 0 ? <DAOButton label={t('notifications.markAllRead')} variant="ghost" size="sm" onPress={vm.markAll} /> : null} />
      <FlatList
        data={vm.list}
        keyExtractor={(n) => String(n.id)}
        onEndReached={vm.loadMore}
        onRefresh={() => void vm.notifications.refetch()}
        refreshing={vm.notifications.isRefetching}
        contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingBottom: spacing.huge }}
        ListEmptyComponent={vm.notifications.isPending ? <ListSkeleton /> : vm.notifications.isError ? <DAOErrorState error={vm.notifications.error} onRetry={() => void vm.notifications.refetch()} /> : <DAOEmptyState title={t('notifications.empty')} />}
        renderItem={({ item }) => {
          const icon = ICONS[item.type];
          return (
            <Pressable accessibilityRole="button" onPress={() => vm.open(item)} style={{ flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.read_at ? colors.surfaceMuted : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                {icon ? <Feather name={icon} size={16} color={colors.primary} /> : <DAOStar size={14} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <DAOText variant={item.read_at ? 'body' : 'bodyMedium'}>{item.title}</DAOText>
                <DAOText variant="bodySmall" tone="textMuted">{item.body}</DAOText>
                <DAOText variant="caption" tone="textSubtle">{formatDate(item.created_at, locale, true)}</DAOText>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
