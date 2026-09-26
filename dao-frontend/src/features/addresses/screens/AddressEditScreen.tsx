import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOChip, DAOHeader, DAOInput, DAOScreen, DAOText } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { useAddressEditScreen } from '../hooks/useAddressEditScreen';

export default function AddressEditScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const vm = useAddressEditScreen();
  const f = vm.form;
  const req = (label: string) => `${label} *`;

  return (
    <DAOScreen header={<DAOHeader title={vm.isEdit ? t('addresses.edit') : t('addresses.add')} />}>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <DAOText variant="bodySmall" tone="textMuted">{t('addresses.country')}</DAOText>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <DAOChip label={t('addresses.countries.TH')} selected={f.country_code === 'TH'} onPress={() => vm.set('country_code')('TH')} />
            <DAOChip label={t('addresses.countries.MM')} selected={f.country_code === 'MM'} onPress={() => vm.set('country_code')('MM')} />
          </View>
        </View>
        <DAOInput label={req(t('addresses.recipientName'))} value={f.recipient_name} onChangeText={vm.set('recipient_name')} textContentType="name" error={vm.fieldError('recipient_name')} />
        <DAOInput label={req(t('addresses.phone'))} value={f.phone} onChangeText={vm.set('phone')} keyboardType="phone-pad" textContentType="telephoneNumber" error={vm.fieldError('phone')} />
        <DAOInput label={req(t('addresses.addressLine1'))} value={f.address_line1} onChangeText={vm.set('address_line1')} textContentType="streetAddressLine1" error={vm.fieldError('address_line1')} />
        <DAOInput label={t('addresses.addressLine2')} value={f.address_line2 ?? ''} onChangeText={vm.set('address_line2')} textContentType="streetAddressLine2" />
        <DAOInput label={vm.labels.subdistrict} value={f.subdistrict ?? ''} onChangeText={vm.set('subdistrict')} />
        <DAOInput label={t('addresses.district')} value={f.district ?? ''} onChangeText={vm.set('district')} />
        <DAOInput label={req(vm.labels.region)} value={f.region ?? ''} onChangeText={vm.set('region')} error={vm.fieldError('region')} />
        {f.country_code === 'MM' ? <DAOInput label={t('addresses.city')} value={f.city ?? ''} onChangeText={vm.set('city')} textContentType="addressCity" /> : null}
        <DAOInput label={f.country_code === 'TH' ? req(t('addresses.postalCode')) : t('addresses.postalCode')} value={f.postal_code ?? ''} onChangeText={vm.set('postal_code')} keyboardType="number-pad" textContentType="postalCode" error={vm.fieldError('postal_code')} />
        <DAOInput label={t('addresses.notes')} value={f.notes ?? ''} onChangeText={vm.set('notes')} multiline />
        <DAOChip label={t('addresses.setDefault')} selected={!!f.is_default} onPress={() => vm.set('is_default')(!f.is_default)} />
        <DAOButton label={t('common.save')} size="lg" fullWidth onPress={vm.submit} loading={vm.saving} disabled={!vm.valid} />
        {vm.isEdit ? <DAOButton label={t('common.delete')} variant="danger" fullWidth onPress={vm.remove} /> : null}
      </View>
    </DAOScreen>
  );
}
