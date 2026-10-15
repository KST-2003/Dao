import { MAPBOX_TOKEN } from '@/shared/constants/config';

const GEOCODE_BASE = 'https://api.mapbox.com/search/geocode/v6';
const GEOCODE_LIMIT = 5;

export interface GeocodingResult {
  id: string;
  name: string;
  fullAddress: string;
  /** [lng, lat] */
  coordinates: [number, number];
  /** ISO 3166-1 alpha-2, upper case (e.g. TH); null when Mapbox doesn't say. */
  country: string | null;
}

export interface ReverseGeocodingResult {
  address: string;
  country: string | null;
}

interface GeocodeFeature {
  id?: string;
  geometry?: { coordinates?: number[] };
  properties?: { name?: string; full_address?: string; place_formatted?: string; context?: { country?: { country_code?: string } } };
}
interface GeocodeResponse { features?: GeocodeFeature[] }

async function getJson(url: URL): Promise<GeocodeResponse | null> {
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  const res = await fetch(url.toString());
  return res.ok ? ((await res.json()) as GeocodeResponse) : null;
}

const countryOf = (f: GeocodeFeature): string | null => f.properties?.context?.country?.country_code?.toUpperCase() ?? null;

/** Pin → street address and its country. Returns null when nothing resolves, the request fails, or there is no token. */
export async function reverseGeocodeApi(lng: number, lat: number, language: string): Promise<ReverseGeocodingResult | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const url = new URL(`${GEOCODE_BASE}/reverse`);
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('language', language);
    const data = await getJson(url);
    const feature = data?.features?.[0];
    const address = feature?.properties?.full_address;
    return feature && address ? { address, country: countryOf(feature) } : null;
  } catch {
    return null;
  }
}

/** Text → places, optionally biased toward `proximity` ([lng, lat]). Returns [] for blank input or any failure. */
export async function geocodeQueryApi(query: string, countries: readonly string[], language: string, proximity?: [number, number]): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (!q || !MAPBOX_TOKEN) return [];
  try {
    const url = new URL(`${GEOCODE_BASE}/forward`);
    url.searchParams.set('q', q);
    url.searchParams.set('language', language);
    url.searchParams.set('types', 'poi,place,address,district');
    url.searchParams.set('limit', String(GEOCODE_LIMIT));
    url.searchParams.set('country', countries.join(',').toLowerCase());
    if (proximity) url.searchParams.set('proximity', proximity.join(','));
    const data = await getJson(url);
    return (data?.features ?? []).flatMap((f): GeocodingResult[] => {
      const [lng, lat] = f.geometry?.coordinates ?? [];
      const name = f.properties?.name;
      if (!f.id || name === undefined || lng === undefined || lat === undefined) return [];
      return [{ id: f.id, name, fullAddress: f.properties?.full_address ?? [name, f.properties?.place_formatted].filter(Boolean).join(', '), coordinates: [lng, lat], country: countryOf(f) }];
    });
  } catch {
    return [];
  }
}
