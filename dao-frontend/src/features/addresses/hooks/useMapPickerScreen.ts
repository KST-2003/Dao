import { router, useLocalSearchParams } from 'expo-router';
import { MAPBOX_TOKEN } from '@/shared/constants/config';
import { usePickedLocationStore } from '@/shared/store/pickedLocationStore';
import type { GeocodingResult } from '@/shared/api/mapbox';
import type { MapCoords } from '../constants/map';
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

  const canConfirm = !camera.geocoding && camera.resolvedAddress.trim() !== '';
  const handleBack = () => router.back();
  const handleConfirm = () => {
    if (!canConfirm) return;
    usePickedLocationStore.getState().set({ lat: camera.center[1], lng: camera.center[0], address: camera.resolvedAddress });
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
    handleCurrentLocation: () => void handleCurrentLocation(),
    handleSelectSuggestion,
    handleConfirm,
    handleBack,
  };
}
