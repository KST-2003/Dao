import type { Address } from '@/types/models';

export type MapCoords = [lng: number, lat: number];

/** Where the picker opens when there are no saved coordinates and no GPS fix. Unknown country → Thailand. */
export const DEFAULT_MAP_CENTERS: Record<Address['country_code'], MapCoords> = {
  TH: [100.5018, 13.7563],
  MM: [96.1735, 16.8409],
};
export const FALLBACK_COUNTRY: Address['country_code'] = 'TH';

/** ISO codes the place search is limited to (reverse geocoding is never filtered). */
export const SEARCH_COUNTRIES = ['TH', 'MM'] as const;

export const ZOOM_DEFAULT = 14;
export const ZOOM_CURRENT_LOCATION = 15;
export const ZOOM_SUGGESTION = 16;

export const CAMERA_ANIMATION_MS = 500;
export const INITIAL_CAMERA_DELAY_MS = 50;
export const REVERSE_GEOCODE_DEBOUNCE_MS = 600;
export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_MIN_CHARS = 2;
export const PIN_SIZE = 40;
