import { Keyboard } from 'react-native';
import type { GeocodingResult } from '@/shared/api/mapbox';
import { ZOOM_SUGGESTION, type MapCoords } from '../constants/map';

/** Picking a suggestion flies the camera there, shows its address, and closes the list + keyboard. */
export function useMapPickerSuggestionSelect(moveTo: (c: MapCoords, zoom: number, address?: string) => void, clearSearch: () => void) {
  return (s: GeocodingResult) => {
    moveTo(s.coordinates, ZOOM_SUGGESTION, s.fullAddress);
    clearSearch();
    Keyboard.dismiss();
  };
}
