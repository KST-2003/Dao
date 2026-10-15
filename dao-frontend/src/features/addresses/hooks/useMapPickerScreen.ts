import { router, useLocalSearchParams } from 'expo-router';
import { MAPBOX_TOKEN } from '@/shared/constants/config';
import { usePickedLocationStore } from '@/shared/store/pickedLocationStore';
import type { GeocodingResult } from '@/shared/api/mapbox';
import { isSupportedCountry, type MapCoords } from '../constants/map';
import { useMapPickerCamera } from './useMapPickerCamera';
import { useMapPickerLocation } from './useMapPickerLocation';
import { useMapPickerSearch } from './useMapPickerSearch';
import { useMapPickerSuggestionSelect } from './useMapPickerSuggestionSelect';


export interface MapPickerScreenVm {
  tokenMissing: boolean;
  cameraRef: ReturnType<typeof useMapPickerCamera>['cameraRef'];
  handleCameraChanged: ReturnType<typeof useMapPickerCamera>['handleCameraChanged'];
  resolvedAddress: string;
  geocoding: boolean;
  query: string;
  setQuery: (q: string) => void;
  suggestions: GeocodingResult[];
  searching: boolean;
  isLocating: boolean;
  canConfirm: boolean;
  /** The pin is in a country we don't deliver to — show the warning and block confirming. */
  outsideArea: boolean;
  handleCurrentLocation: () => void;
  handleSelectSuggestion: (s: GeocodingResult) => void;
  handleConfirm: () => void;
  handleBack: () => void;
}

/** `start` is resolved by useMapPickerStart before this mounts, so the camera is positioned exactly once. */
export function useMapPickerScreen(start: MapCoords): MapPickerScreenVm {
  const { address } = useLocalSearchParams<{ address?: string }>();
  const camera = useMapPickerCamera(start, address ?? '');
  const search = useMapPickerSearch(camera.center);
  const { isLocating, handleCurrentLocation } = useMapPickerLocation(camera.moveTo);
  const handleSelectSuggestion = useMapPickerSuggestionSelect(camera.moveTo, search.clearSearch);

  // Only Thailand and Myanmar. A pin whose country is still unknown can't be confirmed either.
  const outsideArea = !camera.geocoding && camera.country !== null && !isSupportedCountry(camera.country);
  const canConfirm = !camera.geocoding && camera.resolvedAddress.trim() !== '' && isSupportedCountry(camera.country);
  const handleBack = () => router.back();
  const handleConfirm = () => {
    if (!canConfirm || !isSupportedCountry(camera.country)) return;
    usePickedLocationStore.getState().set({ lat: camera.center[1], lng: camera.center[0], address: camera.resolvedAddress, country: camera.country });
    router.back();
  };

  return {
    tokenMissing: !MAPBOX_TOKEN,
    cameraRef: camera.cameraRef,
    handleCameraChanged: camera.handleCameraChanged,
    resolvedAddress: camera.resolvedAddress,
    geocoding: camera.geocoding,
    query: search.query,
    setQuery: search.setQuery,
    suggestions: search.suggestions,
    searching: search.searching,
    isLocating,
    canConfirm,
    outsideArea,
    handleCurrentLocation: () => void handleCurrentLocation(),
    handleSelectSuggestion,
    handleConfirm,
    handleBack,
  };
}
