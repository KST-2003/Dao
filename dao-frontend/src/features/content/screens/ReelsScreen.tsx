import { StatusBar } from 'expo-status-bar';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOEmptyState, DAOErrorState, DAOLoadingSkeleton } from '@/shared/components';
import { media } from '@/shared/theme';
import { ReelCategoryTabs } from '../components/ReelCategoryTabs';
import { ReelItem } from '../components/ReelItem';
import { useReelsScreen } from '../hooks/useReelsScreen';

/** Dao's channel as vertical reels: swipe up for the next video, categories along the top. */
export default function ReelsScreen() {
  const { t } = useTranslation();
  const vm = useReelsScreen();

  return (
    <View style={{ flex: 1, backgroundColor: media.midnight }} onLayout={vm.onLayout}>
      {/* Dark video sits under the status bar, so force light icons — only while this tab is showing. */}
      {vm.focused ? <StatusBar style="light" /> : null}
      {vm.height > 0 && vm.videos.length > 0 ? (
        <FlatList
          key={vm.category ?? 'all'}
          ref={vm.listRef}
          data={vm.videos}
          keyExtractor={(v) => String(v.id)}
          pagingEnabled
          snapToInterval={vm.height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: vm.height, offset: vm.height * i, index: i })}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          removeClippedSubviews
          onMomentumScrollEnd={vm.onSettle}
          onEndReached={vm.loadMore}
          onEndReachedThreshold={1.5}
          renderItem={({ item, index }) => <ReelItem video={item} height={vm.height} playing={vm.focused && index === vm.index} />}
        />
      ) : vm.feed.isError ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><DAOErrorState error={vm.feed.error} onRetry={() => void vm.feed.refetch()} /></View>
      ) : vm.feed.isPending || vm.height === 0 ? (
        <View style={{ flex: 1 }}><DAOLoadingSkeleton height={vm.height || 600} radius={0} /></View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center' }}><DAOEmptyState title={t('vlog.empty')} /></View>
      )}
      <ReelCategoryTabs categories={vm.categories} selected={vm.category} onPick={vm.pickCategory} />
    </View>
  );
}
