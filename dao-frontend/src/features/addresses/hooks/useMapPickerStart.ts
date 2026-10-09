import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { DEFAULT_MAP_CENTERS, FALLBACK_COUNTRY, type MapCoords } from '../constants/map';

const num = (v?: string) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

/** Starting pin: saved coordinates → GPS (only if permission is already granted, never prompts) → country default. */
export function useMapPickerStart(): MapCoords | null {
  const params = useLocalSearchParams<{ lat?: string; lng?: string; country?: string }>();
  const lat = num(params.lat);
  const lng = num(params.lng);
  const country = params.country;
  const [start, setStart] = useState<MapCoords | null>(lat !== undefined && lng !== undefined ? [lng, lat] : null);

  useEffect(() => {
    if (start) return;
    let cancelled = false;
    const fallback = DEFAULT_MAP_CENTERS[country === 'MM' ? 'MM' : FALLBACK_COUNTRY];
    (async () => {
      try {
        const { granted } = await Location.getForegroundPermissionsAsync();
        const pos = granted ? await Location.getLastKnownPositionAsync() : null;
        if (!cancelled) setStart(pos ? [pos.coords.longitude, pos.coords.latitude] : fallback);
      } catch {
        if (!cancelled) setStart(fallback);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return start;
}
