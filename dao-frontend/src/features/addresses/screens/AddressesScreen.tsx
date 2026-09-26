import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AsyncState, DAOBadge, DAOButton, DAOCard, DAOHeader, DAOScreen, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { useAddresses } from '../api';

export default function AddressesScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const addresses = useAddresses();
  const add = () => router.push('/addresses/edit');
  return (
    <DAOScreen header={<DAOHeader title={t('addresses.title')} />}>
      <AsyncState query={addresses} isEmpty={(a) => a.length === 0} empty={{ title: t('addresses.empty'), actionLabel: t('addresses.add'), onAction: add }}>
        {(list) => (
          <View style={{ gap: spacing.md }}>
            {list.map((a) => (
              <DAOCard key={a.id} onPress={() => router.push({ pathname: '/addresses/edit', params: { id: String(a.id) } })} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <DAOText variant="bodyMedium">{a.recipient_name}</DAOText>
                  {a.is_default ? <DAOBadge label={t('addresses.default')} tone="sage" /> : null}
                </View>
                <DAOText variant="bodySmall" tone="textMuted">{[a.address_line1, a.subdistrict, a.district, a.region, a.postal_code].filter(Boolean).join(', ')}</DAOText>
                <DAOText variant="caption" tone="textSubtle">{a.phone}</DAOText>
              </DAOCard>
            ))}
            <DAOButton label={t('addresses.add')} icon="plus" variant="secondary" fullWidth onPress={add} />
          </View>
        )}
      </AsyncState>
    </DAOScreen>
  );
}
