import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { geocodeQueryApi, type GeocodingResult } from '@/shared/api/mapbox';
import { SEARCH_COUNTRIES, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS, type MapCoords } from '../constants/map';

/** Debounced forward geocoding biased to the pin; out-of-order responses are dropped. */
export function useMapPickerSearch(center: MapCoords) {
  const { i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const requestId = useRef(0);
  const centerRef = useRef(center);
  centerRef.current = center;

  useEffect(() => {
    const id = ++requestId.current;
    if (query.trim().length < SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await geocodeQueryApi(query, SEARCH_COUNTRIES, i18n.language, centerRef.current);
      if (id !== requestId.current) return;
      setSuggestions(results);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, i18n.language]);

  const clearSearch = () => { setQuery(''); setSuggestions([]); };

  return { query, setQuery, suggestions, searching, clearSearch };
}
