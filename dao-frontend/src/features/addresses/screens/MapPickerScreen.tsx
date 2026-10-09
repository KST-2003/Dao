import { Ionicons } from '@expo/vector-icons';
import Mapbox from '@rnmapbox/maps';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { DAOButton, DAOIconButton, DAOText } from '@/shared/components';
import { MAPBOX_STYLE, MAPBOX_TOKEN } from '@/shared/constants/config';
import { useTheme } from '@/shared/theme';
import { PIN_SIZE, type MapCoords } from '../constants/map';
import { useMapPickerScreen } from '../hooks/useMapPickerScreen';
import { useMapPickerStart } from '../hooks/useMapPickerStart';
import { useStyles } from './MapPickerScreen.styles';

if (MAPBOX_TOKEN) void Mapbox.setAccessToken(MAPBOX_TOKEN);

export default function MapPickerScreen() {
  const { t } = useTranslation();
  const s = useStyles();
  const start = useMapPickerStart();
  if (!MAPBOX_TOKEN) {
    return <View style={s.center}><DAOText variant="body" align="center">{t('addresses.map.tokenMissing')}</DAOText></View>;
  }
  if (!start) return <View style={s.center}><ActivityIndicator /></View>;
  return <MapPicker start={start} />;
}

function MapPicker({ start }: { start: MapCoords }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const vm = useMapPickerScreen(start);

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Mapbox.MapView style={s.map} styleURL={MAPBOX_STYLE} attributionEnabled={false} logoEnabled={false} onCameraChanged={vm.handleCameraChanged}>
        <Mapbox.Camera ref={vm.cameraRef} animationMode="flyTo" animationDuration={500} />
        <Mapbox.UserLocation visible />
      </Mapbox.MapView>

      <View style={s.pinWrap} pointerEvents="none">
        <Ionicons name="location" size={PIN_SIZE} color={colors.primary} style={s.pin} />
      </View>

      <View style={[s.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.topRow}>
          <DAOIconButton icon="chevron-left" accessibilityLabel={t('common.back')} onPress={vm.handleBack} />
          <View style={s.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              value={vm.query}
              onChangeText={vm.setQuery}
              placeholder={t('addresses.map.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('addresses.map.searchPlaceholder')}
              returnKeyType="search"
              autoCorrect={false}
            />
            {vm.searching ? <ActivityIndicator size="small" /> : null}
          </View>
        </View>
        {vm.suggestions.length > 0 ? (
          <FlatList
            style={s.suggestions}
            data={vm.suggestions}
            keyExtractor={(r) => r.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={s.suggestion} accessibilityRole="button" accessibilityLabel={item.fullAddress} onPress={() => vm.handleSelectSuggestion(item)}>
                <DAOText variant="body" numberOfLines={1}>{item.name}</DAOText>
                <DAOText variant="bodySmall" tone="textMuted" numberOfLines={1}>{item.fullAddress}</DAOText>
              </Pressable>
            )}
          />
        ) : null}
      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <DAOButton variant="secondary" icon="crosshair" label={t('addresses.map.useCurrentLocation')} loading={vm.isLocating} onPress={vm.handleCurrentLocation} fullWidth />
        <View style={s.addressCard}>
          {vm.geocoding ? <ActivityIndicator /> : <Ionicons name="location-outline" size={20} color={colors.primary} />}
          <DAOText variant="body" style={s.addressText} numberOfLines={2} tone={vm.resolvedAddress ? undefined : 'textMuted'}>
            {vm.geocoding ? t('addresses.map.locating') : vm.resolvedAddress || t('addresses.map.moveHint')}
          </DAOText>
        </View>
        <DAOButton label={t('addresses.map.confirm')} size="lg" fullWidth disabled={!vm.canConfirm} onPress={vm.handleConfirm} />
      </View>
    </KeyboardAvoidingView>
  );
}
