import { View } from 'react-native';
import { DAOHeader, DAOImage, DAOText } from '@/shared/components';
import { ratios, useTheme } from '@/shared/theme';
import { CartButton } from '../components/CartButton';
import { ProductBrowser } from '../components/ProductBrowser';
import { useCollectionScreen } from '../hooks/useCategoryScreen';

export default function CollectionScreen() {
  const { colors, spacing, radius } = useTheme();
  const { collection: c, base } = useCollectionScreen();
  const header = c ? (
    <View style={{ paddingHorizontal: spacing.gutter, gap: spacing.md, marginBottom: spacing.xl }}>
      <View style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
        <DAOImage uri={c.hero_image_url} ratio={ratios.collection} priority="high" />
      </View>
      {c.subtitle ? <DAOText variant="overline" tone="textMuted">{c.subtitle}</DAOText> : null}
      {c.description ? <DAOText tone="textMuted">{c.description}</DAOText> : null}
    </View>
  ) : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DAOHeader title={c?.name ?? ''} large right={<CartButton />} />
      <ProductBrowser base={base} header={header} />
    </View>
  );
}
