import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOCard, DAOChip, DAODivider, DAOHeader, DAOListItem, DAOModal, DAOScreen, DAOText } from '@/shared/components';
import { APP_VERSION } from '@/shared/constants/config';
import { LOCALE_NATIVE_NAMES } from '@/shared/i18n';
import { useLocale } from '@/shared/hooks/useLocale';
import { useTheme } from '@/shared/theme';
import type { AuthProvider } from '@/types/enums';
import { useSettingsScreen } from '../hooks/useSettingsScreen';

const PROVIDERS: { key: AuthProvider; label: string }[] = [
  { key: 'line', label: 'LINE' },
  { key: 'google', label: 'Google' },
  { key: 'sms', label: 'SMS' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { spacing } = useTheme();
  const vm = useSettingsScreen();

  return (
    <DAOScreen header={<DAOHeader title={t('settings.title')} />}>
      <View style={{ gap: spacing.xl }}>
        <DAOCard>
          <DAOListItem icon="globe" label={t('settings.language')} value={LOCALE_NATIVE_NAMES[locale]} onPress={vm.goLanguage} />
        </DAOCard>
        <View style={{ gap: spacing.sm }}>
          <DAOText variant="subheading">{t('settings.theme')}</DAOText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {(['system', 'botanical', 'midnight'] as const).map((m) => <DAOChip key={m} label={t(`settings.themes.${m}`)} selected={vm.themeMode === m} onPress={() => vm.setTheme(m)} />)}
          </View>
        </View>
        {vm.signedIn ? (
          <>
            <DAOCard>
              <DAOListItem icon="bell" label={t('settings.pushNotifications')} onPress={() => void vm.enablePush()} />
            </DAOCard>
            <View style={{ gap: spacing.sm }}>
              <DAOText variant="subheading">{t('settings.linkedAccounts')}</DAOText>
              <DAOCard>
                {PROVIDERS.map((p, i) => (
                  <View key={p.key}>
                    {i > 0 ? <DAODivider /> : null}
                    <DAOListItem label={p.label} value={vm.isLinked(p.key) ? t('settings.connected') : '—'}
                      onPress={vm.isLinked(p.key) && vm.providers.length > 1 ? () => vm.unlink(p.key) : undefined} />
                  </View>
                ))}
              </DAOCard>
            </View>
            <DAOCard>
              <DAOListItem icon="trash-2" label={t('profile.deleteAccount')} danger onPress={vm.askDelete} />
            </DAOCard>
          </>
        ) : null}
        <DAOText variant="caption" tone="textSubtle" align="center">DAO · {t('settings.version', { version: APP_VERSION })}</DAOText>
      </View>
      <DAOModal visible={vm.confirmDelete} onClose={vm.closeDelete} title={t('profile.deleteAccount')} message={t('profile.deleteAccountConfirm')}
        confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} onConfirm={vm.deleteAccount} destructive loading={vm.deleting} />
    </DAOScreen>
  );
}
