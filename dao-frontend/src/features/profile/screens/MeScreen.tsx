import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  DAOAvatar, DAOButton, DAOCard, DAODivider, DAOIconButton, DAOListItem, DAOLoadingSkeleton, DAOLogo, DAOModal, DAOPointCard, DAOScreen, DAOText,
} from '@/shared/components';
import { LOCALE_NATIVE_NAMES } from '@/shared/i18n';
import { useLocale } from '@/shared/hooks/useLocale';
import { useTheme } from '@/shared/theme';
import { useMeScreen } from '../hooks/useMeScreen';

export default function MeScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const vm = useMeScreen();
  const user = vm.me.data;
  const m = vm.membership.data;

  if (!vm.signedIn) {
    return (
      <DAOScreen header={<View style={{ height: insets.top + spacing.lg }} />}>
        <View style={{ alignItems: 'center', gap: spacing.lg, marginTop: spacing.xxxl }}>
          <DAOLogo variant="mark" size={110} />
          <DAOText variant="title" align="center">{t('profile.guestTitle')}</DAOText>
          <DAOText tone="textMuted" align="center">{t('profile.guestSubtitle')}</DAOText>
          <DAOButton label={t('auth.signIn')} size="lg" fullWidth onPress={vm.signIn} />
        </View>
        <DAOCard style={{ marginTop: spacing.xxxl }}>
          <DAOListItem icon="globe" label={t('profile.menu.language')} value={LOCALE_NATIVE_NAMES[locale]} onPress={() => vm.go('/language')} />
          <DAODivider />
          <DAOListItem icon="settings" label={t('profile.menu.settings')} onPress={() => vm.go('/settings')} />
        </DAOCard>
      </DAOScreen>
    );
  }

  const name = user?.display_name || user?.name || t('profile.defaultName');
  return (
    <DAOScreen header={<View style={{ height: insets.top + spacing.md }} />} refreshing={vm.me.isRefetching} onRefresh={vm.refresh}>
      <Pressable onPress={() => vm.go('/edit-profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
        <DAOAvatar uri={user?.avatar_url} name={name} size={56} />
        <View style={{ flex: 1 }}>
          <DAOText variant="heading">{t('profile.hello', { name })}</DAOText>
          {user?.phone || user?.email ? <DAOText variant="caption" tone="textMuted">{user.phone ?? user.email}</DAOText> : null}
        </View>
        <DAOIconButton icon="edit-2" accessibilityLabel={t('profile.editProfile')} tone="plain" onPress={() => vm.go('/edit-profile')} />
      </Pressable>

      {m ? (
        <DAOPointCard tier={m.tier} balance={m.balance} progress={m.progress} pointsToNext={m.points_to_next} nextTierName={m.next_tier?.name ?? null} onPress={() => vm.go('/membership')} />
      ) : <DAOLoadingSkeleton height={190} radius={24} />}
      <DAOButton label={t('membership.viewBenefits')} variant="ghost" onPress={() => vm.go('/membership')} style={{ alignSelf: 'center', marginVertical: spacing.sm }} />

      <DAOCard style={{ marginTop: spacing.md }}>
        <DAOListItem icon="package" label={t('profile.menu.orders')} onPress={() => vm.go('/orders')} />
        <DAODivider />
        <DAOListItem icon="heart" label={t('profile.menu.wishlist')} onPress={() => vm.goSaved('product')} />
        <DAODivider />
        <DAOListItem icon="play-circle" label={t('profile.menu.savedVideos')} onPress={() => vm.goSaved('video')} />
        <DAODivider />
        <DAOListItem icon="book-open" label={t('profile.menu.savedRecipes')} onPress={() => vm.goSaved('recipe')} />
      </DAOCard>

      <DAOCard style={{ marginTop: spacing.lg }}>
        <DAOListItem icon="star" label={t('brand.points')} onPress={() => vm.go('/points')} />
        <DAODivider />
        <DAOListItem icon="gift" label={t('profile.menu.rewards')} onPress={() => vm.go('/rewards')} />
        <DAODivider />
        <DAOListItem icon="tag" label={t('profile.menu.coupons')} onPress={() => vm.go('/rewards')} />
        <DAODivider />
        <DAOListItem icon="user-plus" label={t('profile.menu.referral')} onPress={() => vm.go('/referral')} />
      </DAOCard>

      <DAOCard style={{ marginTop: spacing.lg }}>
        <DAOListItem icon="map-pin" label={t('profile.menu.addresses')} onPress={() => vm.go('/addresses')} />
        <DAODivider />
        <DAOListItem icon="credit-card" label={t('profile.menu.paymentMethods')} onPress={() => vm.go('/payment-methods')} />
        <DAODivider />
        <DAOListItem icon="globe" label={t('profile.menu.language')} value={LOCALE_NATIVE_NAMES[locale]} onPress={() => vm.go('/language')} />
        <DAODivider />
        <DAOListItem icon="bell" label={t('profile.menu.notifications')} onPress={() => vm.go('/notifications')} />
        <DAODivider />
        <DAOListItem icon="settings" label={t('profile.menu.settings')} onPress={() => vm.go('/settings')} />
      </DAOCard>

      <DAOButton label={t('auth.logout')} variant="ghost" onPress={vm.askLogout} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      <DAOText variant="caption" tone="textSubtle" align="center" italic>{t('brand.thankYou')} ♡</DAOText>

      <DAOModal visible={vm.confirmLogout} onClose={vm.closeLogout} title={t('auth.logoutConfirm')} confirmLabel={t('auth.logout')} cancelLabel={t('common.cancel')} onConfirm={vm.logout} loading={vm.loggingOut} />
    </DAOScreen>
  );
}
