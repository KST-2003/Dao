import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAOAvatar, DAOButton, DAOHeader, DAOIconButton, DAOInput, DAOScreen } from '@/shared/components';
import { useTheme } from '@/shared/theme';
import { useEditProfileScreen } from '../hooks/useEditProfileScreen';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { spacing, colors } = useTheme();
  const vm = useEditProfileScreen();
  const name = vm.user?.display_name || vm.user?.name || null;

  return (
    <DAOScreen header={<DAOHeader title={t('profile.editProfile')} />}>
      <View style={{ gap: spacing.xl }}>
        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
          <View>
            <DAOAvatar uri={vm.user?.avatar_url} name={name} size={96} />
            {vm.uploadingPhoto ? (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 48, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.onPrimary} />
              </View>
            ) : (
              <DAOIconButton
                icon="camera"
                accessibilityLabel={t('profile.changePhoto')}
                tone="primary"
                size={32}
                onPress={vm.pickPhoto}
                style={{ position: 'absolute', right: -4, bottom: -4 }}
              />
            )}
          </View>
          <DAOButton label={t('profile.changePhoto')} variant="ghost" onPress={vm.pickPhoto} disabled={vm.uploadingPhoto} />
        </View>
        <DAOInput label={t('auth.displayName')} value={vm.name} onChangeText={vm.setName} autoCapitalize="words" textContentType="nickname" maxLength={60} />
        <DAOButton label={t('common.save')} size="lg" fullWidth onPress={vm.save} loading={vm.saving} />
      </View>
    </DAOScreen>
  );
}
