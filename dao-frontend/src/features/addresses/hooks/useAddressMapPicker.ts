import { router } from 'expo-router';
import { useEffect } from 'react';
import { usePickedLocationStore } from '@/shared/store/pickedLocationStore';
import type { AddressInput } from '@/types/models';

/** Opens the map picker with the form's current location and applies the result when it returns. */
export function useAddressMapPicker(form: AddressInput, setCoordinates: (lat: number, lng: number, address: string) => void) {
  const picked = usePickedLocationStore((s) => s.picked);

  // A pick lives only between "Confirm" and the form consuming it — never across form sessions.
  useEffect(() => {
    usePickedLocationStore.getState().clear();
    return () => usePickedLocationStore.getState().clear();
  }, []);

  useEffect(() => {
    if (!picked) return;
    setCoordinates(picked.lat, picked.lng, picked.address);
    usePickedLocationStore.getState().clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const openMap = () =>
    router.push({
      pathname: '/addresses/map-picker',
      params: {
        country: form.country_code,
        ...(form.latitude != null && form.longitude != null ? { lat: String(form.latitude), lng: String(form.longitude) } : {}),
        ...(form.address_line1 ? { address: form.address_line1 } : {}),
      },
    });

  return { openMap };
}
