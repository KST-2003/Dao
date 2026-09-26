import { View } from 'react-native';
import { DAOHeader } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { CartButton } from '../components/CartButton';
import { ProductBrowser } from '../components/ProductBrowser';
import { useCategoryScreen } from '../hooks/useCategoryScreen';

export default function CategoryScreen() {
  const { colors } = useTheme();
  const vm = useCategoryScreen();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DAOHeader title={vm.title} large right={<CartButton />} />
      <ProductBrowser base={vm.base} />
    </View>
  );
}
