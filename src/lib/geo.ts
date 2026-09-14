import { Flag, GeoLevel } from '../types';
import {
  SOVEREIGN_CENTROIDS,
  US_STATE_CENTROIDS,
  COUNTRY_NAME_CENTROIDS,
  CITY_GAZETTEER,
} from '../data/geo/centroids';

export interface ResolvedGeo {
  lat: number;
  lon: number;
  geoLevel: GeoLevel;
  approx: boolean;
  /** machine-readable reason, useful for the "Location needed" bucket */
  source: 'explicit' | 'builtin-sovereign' | 'builtin-us-state' | 'city-gazetteer' | 'parent-fallback' | 'unmapped' | 'non-geo';
}

export const NON_GEO_CATEGORIES = new Set([
  'Fictional',
  'LGBTQI+',
  'Languages',
  'Pirate Flags',
  'Organizations',
  'Concepts',
]);

const CITY_SUFFIX_RE =
  /\s*\((city flag|capital city flag|capital city|city)\)\s*$/i;

export function stripCitySuffix(name: string): string {
  return name.replace(CITY_SUFFIX_RE, '').trim();
}

export function isLikelyCity(flag: Flag): boolean {
  if (flag.geoLevel === 'city') return true;
  return CITY_SUFFIX_RE.test(flag.name || '');
}

export function isNonGeo(flag: Flag): boolean {
  if (flag.geoLevel === 'non-geo') return true;
  return NON_GEO_CATEGORIES.has(flag.category as string);
}

/**
 * Resolve a mappable point for ANY flag — built-in or Firestore cloud doc.
 * Never throws; returns null when the flag should not be pinned
 * (non-geo categories, or unknown location that must not be faked).
 */
export function resolveGeo(flag: Flag): ResolvedGeo | null {
  if (isNonGeo(flag)) return null;

  // 1. Explicit admin-set coordinates win (works for cloud flags too).
  if (typeof flag.lat === 'number' && typeof flag.lon === 'number' &&
      Number.isFinite(flag.lat) && Number.isFinite(flag.lon)) {
    return {
      lat: flag.lat,
      lon: flag.lon,
      geoLevel: flag.geoLevel || inferLevel(flag),
      approx: flag.geoApprox === true,
      source: 'explicit',
    };
  }

  const code = (flag.code || '').toLowerCase().trim();
  const id = (flag.id || '').toLowerCase().trim();

  // 2. Sovereign states by ISO code.
  const sov = SOVEREIGN_CENTROIDS[code] || SOVEREIGN_CENTROIDS[id];
  if (sov && (flag.category === 'Sovereign States' || flag.category === 'Non-Sovereign & Unrecognized' || !flag.category)) {
    return { lat: sov[0], lon: sov[1], geoLevel: 'country', approx: false, source: 'builtin-sovereign' };
  }
  // Non-sovereign territories often share the ISO table regardless of category.
  if (sov && code.length === 2) {
    return { lat: sov[0], lon: sov[1], geoLevel: 'country', approx: false, source: 'builtin-sovereign' };
  }

  // 3. US states by 3166-2 code.
  const us = US_STATE_CENTROIDS[code] || US_STATE_CENTROIDS[id];
  if (us) {
    return { lat: us[0], lon: us[1], geoLevel: 'state', approx: false, source: 'builtin-us-state' };
  }

  // 4. City heuristic: "X (City Flag)" / "(Capital City)" / "(City)".
  if (isLikelyCity(flag)) {
    const cityName = stripCitySuffix(flag.name || '').toLowerCase();
    const hit = CITY_GAZETTEER[cityName];
    if (hit) {
      return { lat: hit[0], lon: hit[1], geoLevel: 'city', approx: false, source: 'city-gazetteer' };
    }
    // Unknown city: do NOT fake it at the country center on the map.
    return null;
  }

  // 5. Provinces & territories: parent-country fallback, explicitly approx.
  if (flag.country) {
    const parent = COUNTRY_NAME_CENTROIDS[flag.country.trim()];
    if (parent) {
      // Deterministic jitter so sibling provinces don't stack exactly.
      const j = jitterFor(flag.id);
      return {
        lat: parent[0] + j[0],
        lon: parent[1] + j[1],
        geoLevel: flag.category === 'US States' ? 'state' : 'province',
        approx: true,
        source: 'parent-fallback',
      };
    }
  }

  return null;
}

function inferLevel(flag: Flag): GeoLevel {
  if (isLikelyCity(flag)) return 'city';
  if (flag.category === 'Sovereign States' || flag.category === 'Non-Sovereign & Unrecognized') return 'country';
  if (flag.category === 'US States') return 'state';
  if (flag.category === 'Provinces & Territories') return 'province';
  if (flag.category === 'Indigenous & Cultural Populations') return 'culture';
  return 'region';
}

/** Deterministic pseudo-jitter in degrees from a string id (stable across renders). */
function jitterFor(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = ((h % 1000) / 1000 - 0.5) * 6; // ±3°
  const b = (((h >> 10) % 1000) / 1000 - 0.5) * 6;
  return [a, b];
}

export interface GeoBuckets {
  mapped: { flag: Flag; geo: ResolvedGeo }[];
  approx: { flag: Flag; geo: ResolvedGeo }[];
  unmapped: Flag[];
  nonGeo: Flag[];
}

/** Split a flag list for the Atlas UI. Pure + memo-friendly. */
export function bucketFlags(flags: Flag[]): GeoBuckets {
  const mapped: GeoBuckets['mapped'] = [];
  const approx: GeoBuckets['approx'] = [];
  const unmapped: Flag[] = [];
  const nonGeo: Flag[] = [];
  for (const f of flags) {
    if (isNonGeo(f)) { nonGeo.push(f); continue; }
    const g = resolveGeo(f);
    if (!g) { unmapped.push(f); continue; }
    if (g.approx) approx.push({ flag: f, geo: g });
    else mapped.push({ flag: f, geo: g });
  }
  return { mapped, approx, unmapped, nonGeo };
}

/** Nominatim single-lookup for the admin "Detect from name" button. Rate-limited by design (one call per click). */
export async function nominatimLookup(query: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) return null;
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, displayName: String(first.display_name || query) };
}
