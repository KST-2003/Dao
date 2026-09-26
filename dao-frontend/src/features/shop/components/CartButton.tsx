import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCartCount } from '@/features/cart/api';
import { DAOIconButton, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';

export function CartButton() {
  const { t } = useTranslation();
  const count = useCartCount();
  const { colors } = useTheme();
  return (
    <View>
      <DAOIconButton icon="shopping-bag" accessibilityLabel={`${t('cart.title')} ${count}`} onPress={() => router.push('/cart')} />
      {count > 0 ? (
        <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <DAOText variant="caption" style={{ color: colors.onPrimary, fontSize: 10, lineHeight: 12 }}>{count}</DAOText>
        </View>
      ) : null}
    </View>
  );
}
