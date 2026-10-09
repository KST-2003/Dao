import type { Camera, MapState } from '@rnmapbox/maps';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reverseGeocodeApi } from '@/shared/api/mapbox';
import { CAMERA_ANIMATION_MS, INITIAL_CAMERA_DELAY_MS, REVERSE_GEOCODE_DEBOUNCE_MS, ZOOM_DEFAULT, type MapCoords } from '../constants/map';

/** Owns the (uncontrolled) camera, the pin's center, and the debounced pin → address lookup. */
export function useMapPickerCamera(startCenter: MapCoords, initialAddress: string) {
  const { i18n } = useTranslation();
  const cameraRef = useRef<Camera>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestId = useRef(0);
  const [center, setCenter] = useState<MapCoords>(startCenter);
  const [resolvedAddress, setResolvedAddress] = useState(initialAddress);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => cameraRef.current?.setCamera({ centerCoordinate: startCenter, zoomLevel: ZOOM_DEFAULT, animationDuration: 0 }), INITIAL_CAMERA_DELAY_MS);
    return () => { clearTimeout(t); clearTimeout(timer.current); requestId.current += 1; };
    // Position once on mount; the camera stays uncontrolled afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraChanged = useCallback((state: MapState) => {
    const [lng, lat] = state.properties.center;
    if (lng === undefined || lat === undefined) return;
    setCenter([lng, lat]);
    clearTimeout(timer.current);
    const id = ++requestId.current; // any later camera move invalidates this lookup
    timer.current = setTimeout(async () => {
      setGeocoding(true);
      const address = await reverseGeocodeApi(lng, lat, i18n.language);
      if (id !== requestId.current) return;
      setResolvedAddress(address ?? '');
      setGeocoding(false);
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }, [i18n.language]);

  const moveTo = useCallback((coords: MapCoords, zoom: number, address?: string) => {
    if (address !== undefined) setResolvedAddress(address);
    cameraRef.current?.setCamera({ centerCoordinate: coords, zoomLevel: zoom, animationDuration: CAMERA_ANIMATION_MS });
  }, []);

  return { cameraRef, center, resolvedAddress, geocoding, handleCameraChanged, moveTo };
}
