import { Feather } from '@expo/vector-icons';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOChip, DAOCollectionCard, DAOText, OfflineBanner } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { CartButton } from '../components/CartButton';
import { ProductBrowser } from '../components/ProductBrowser';
import { useShopScreen } from '../hooks/useShopScreen';
import { useStyles } from './ShopScreen.styles';

export default function ShopScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const vm = useShopScreen();

  const header = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        <DAOChip label={t('shop.all')} selected={!vm.category} onPress={() => vm.selectCategory(undefined)} />
        {vm.categories.map((c) => <DAOChip key={c.id} label={c.name ?? c.slug} selected={vm.category === c.slug} onPress={() => vm.selectCategory(c.slug)} />)}
      </ScrollView>
      {!vm.category && vm.collections.length > 0 ? (
        <FlatList horizontal data={vm.collections} keyExtractor={(c) => String(c.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={s.collections}
          renderItem={({ item }) => <DAOCollectionCard collection={item} width={280} />} />
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <View style={s.top}>
        <DAOText variant="display" accessibilityRole="header">{t('shop.title')}</DAOText>
        <CartButton />
      </View>
      <Pressable accessibilityRole="search" onPress={vm.goSearch} style={s.search}>
        <Feather name="search" size={16} color={colors.textMuted} />
        <DAOText tone="textSubtle">{t('shop.searchPlaceholder')}</DAOText>
      </Pressable>
      <OfflineBanner />
      <ProductBrowser base={vm.base} header={header} />
    </View>
  );
}
