import * as Location from 'expo-location';
import { Linking } from 'react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/shared/store/toastStore';
import { ZOOM_CURRENT_LOCATION, type MapCoords } from '../constants/map';

/** "Use current location": permission → last known fix → fresh fix, with a re-entry guard. */
export function useMapPickerLocation(moveTo: (coords: MapCoords, zoom: number) => void) {
  const { t } = useTranslation();
  const busy = useRef(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleCurrentLocation = async () => {
    if (busy.current) return;
    busy.current = true;
    setIsLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        toast.show(t('addresses.map.permissionDenied'), { label: t('addresses.map.openSettings'), onPress: () => void Linking.openSettings() });
        return;
      }
      const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      moveTo([pos.coords.longitude, pos.coords.latitude], ZOOM_CURRENT_LOCATION);
    } catch {
      toast.error(t('addresses.map.locationFailed'));
    } finally {
      busy.current = false;
      setIsLocating(false);
    }
  };

  return { isLocating, handleCurrentLocation };
}
