import { Flag } from '../types';
import { stripCitySuffix } from './geo';

/** Great-circle distance in km between two lat/lon points. */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface ReverseCountry {
  country: string;
  countryCode: string;
  displayName: string;
}

const reverseCache = new Map<string, ReverseCountry | null>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(1)}|${lon.toFixed(1)}`;
}

/**
 * Forgiving country check: reverse-geocode the click to a country (Nominatim,
 * zoom=3 = country-level) so clicking anywhere inside the right country
 * counts — no polygon bundle needed. Cached per ~0.1° cell. Never throws;
 * returns null when offline / rate-limited / over open ocean.
 */
export async function reverseGeocodeCountry(lat: number, lon: number): Promise<ReverseCountry | null> {
  const key = cacheKey(lat, lon);
  if (reverseCache.has(key)) return reverseCache.get(key) ?? null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&accept-language=en`,
      { headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!res.ok) {
      reverseCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const addr = data?.address ?? {};
    const country = String(addr.country ?? '');
    const countryCode = String(addr.country_code ?? '').toLowerCase();
    if (!country && !countryCode) {
      reverseCache.set(key, null);
      return null;
    }
    const out = { country, countryCode, displayName: String(data?.display_name ?? '') };
    reverseCache.set(key, out);
    // Bound the cache (one entry per map cell; drop oldest half past 500).
    if (reverseCache.size > 500) {
      const keys = Array.from(reverseCache.keys());
      for (let i = 0; i < 250; i++) reverseCache.delete(keys[i]);
    }
    return out;
  } catch {
    reverseCache.set(key, null);
    return null;
  }
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Does the reverse-geocoded click country match the flag's expected country?
 * - Sovereign / non-sovereign: ISO code match (flag.code is ISO alpha-2), or
 *   name-includes fallback (e.g. "United States" vs "United States of America").
 * - Provinces / US states / indigenous with `country`: parent-name match.
 * Returns false when reverse is null (caller falls back to distance).
 */
export function matchesExpectedCountry(reverse: ReverseCountry | null, flag: Flag): boolean {
  if (!reverse) return false;
  const parent = (flag.country || '').trim();
  if (parent) {
    if (!reverse.country) return false;
    const a = norm(reverse.country);
    const b = norm(parent);
    return a === b || a.includes(b) || b.includes(a);
  }
  const code = (flag.code || '').trim().toLowerCase();
  if (code.length === 2 && reverse.countryCode) {
    if (reverse.countryCode === code) return true;
  }
  // Name fallback for sovereign states (handles "USA" aliases, long names).
  const name = norm(flag.name || '');
  const rc = norm(reverse.country || '');
  if (name && rc && (name === rc || name.includes(rc) || rc.includes(name))) return true;
  const aliases = flag.aliases || [];
  if (aliases.some((al) => al && (norm(al) === rc || rc.includes(norm(al)) || norm(al).includes(rc)))) {
    return true;
  }
  return false;
}

export type MapVerdict = 'bullseye' | 'country' | 'region' | 'wrong-region' | 'close' | 'far' | 'miss';

/** Distance (km) inside which a guess counts even without a country match. */
export const MAP_PIN_TOLERANCE_KM = 300;

/**
 * Categories whose flags are sub-national admin regions (states, provinces).
 * For these, landing anywhere in the parent country is NOT enough — the
 * clicked region itself must match. Other categories (sovereign states,
 * indigenous peoples, …) keep country-level scoring: peoples aren't admin
 * regions, so Nominatim state/city fields can't identify them.
 */
export const REGIONAL_QUIZ_CATEGORIES: ReadonlySet<string> = new Set([
  'Provinces & Territories',
  'US States',
]);

export interface MapScore {
  distanceKm: number;
  insideCountry: boolean;
  isCorrect: boolean;
  verdict: MapVerdict;
  /** Region-level match (provinces/states only). */
  regionMatched?: boolean;
  /** Most specific detected locality, e.g. "Bavaria" or "Austin". */
  detectedPlace?: string;
}

/**
 * Forgiving score: correct when the click lands inside the expected country
 * (border-equivalent via reverse-geocode) OR within 300 km of the pin
 * (covers tiny islands / ocean clicks where reverse returns nothing).
 */
export function scoreMapGuess(
  distanceKm: number,
  insideCountry: boolean,
): MapScore {
  const isCorrect = insideCountry || distanceKm <= MAP_PIN_TOLERANCE_KM;
  let verdict: MapVerdict;
  if (distanceKm <= 150) verdict = 'bullseye';
  else if (insideCountry) verdict = 'country';
  else if (distanceKm <= 750) verdict = 'close';
  else if (distanceKm <= 1500) verdict = 'far';
  else verdict = 'miss';
  return { distanceKm, insideCountry, isCorrect, verdict };
}

export const MAP_VERDICT_LABEL: Record<MapVerdict, string> = {
  bullseye: '🎯 Bullseye!',
  country: '✅ Correct country!',
  region: '✅ Correct region!',
  'wrong-region': '⚠️ Right country, wrong region',
  close: 'Close — wrong country',
  far: 'Far off',
  miss: 'Missed',
};

// ---------------------------------------------------------------------------
// Region-level scoring (provinces, US states)
// ---------------------------------------------------------------------------

export interface ReversePlace {
  country: string;
  countryCode: string;
  /** First-level admin area, e.g. "California", "Bavaria", "Ontario". */
  state: string;
  /** Second-level area, e.g. county / district. */
  county: string;
  /** Most specific locality (city / town / village / municipality). */
  locality: string;
  displayName: string;
}

const placeCache = new Map<string, ReversePlace | null>();

function placeCacheKey(lat: number, lon: number): string {
  return `z10|${lat.toFixed(2)}|${lon.toFixed(2)}`;
}

/**
 * Locality-level reverse-geocode (Nominatim zoom=10: country + state +
 * county + city). One call, no polygon bundle — this is what lets regional
 * quizzes distinguish Bavaria from Berlin. Cached per ~0.01° cell. Never
 * throws; null when offline / rate-limited / open ocean.
 */
export async function reverseGeocodePlace(lat: number, lon: number): Promise<ReversePlace | null> {
  const key = placeCacheKey(lat, lon);
  if (placeCache.has(key)) return placeCache.get(key) ?? null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`,
      { headers: { Accept: 'application/json' }, signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (!res.ok) {
      placeCache.set(key, null);
      return null;
    }
    const data = await res.json();
    const addr = data?.address ?? {};
    const pick = (...keys: string[]): string => {
      for (const k of keys) {
        const v = addr[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    };
    const out: ReversePlace = {
      country: pick('country'),
      countryCode: String(addr.country_code ?? '').toLowerCase(),
      state: pick('state', 'province', 'region'),
      county: pick('county', 'state_district', 'district'),
      locality: pick('city', 'town', 'village', 'hamlet', 'municipality', 'borough'),
      displayName: String(data?.display_name ?? ''),
    };
    if (!out.country && !out.countryCode && !out.state && !out.county && !out.locality) {
      placeCache.set(key, null);
      return null;
    }
    placeCache.set(key, out);
    if (placeCache.size > 500) {
      const keys = Array.from(placeCache.keys());
      for (let i = 0; i < 250; i++) placeCache.delete(keys[i]);
    }
    return out;
  } catch {
    placeCache.set(key, null);
    return null;
  }
}

/** Lowercase, diacritics-stripped comparison ("Québec" matches "Quebec"). */
function normPlace(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function regionVariants(flag: Flag): string[] {
  const raw: string[] = [stripCitySuffix(flag.name || ''), ...(flag.aliases || [])];
  return raw.map(normPlace).filter((v) => v.length > 0);
}

function fuzzyRegionEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  // Generous but guarded: "New York City" matches "New York", while
  // single tiny words ("York", "San") can't match by substring.
  return short.length >= 4 && long.includes(short);
}

export interface RegionMatch {
  matched: boolean;
  /** Most specific detected locality, '' when nothing resolved. */
  detected: string;
}

/**
 * Does the clicked place match the flag's region? Compares Nominatim
 * state/county/locality against the flag name (city suffixes stripped) plus
 * aliases. Returns the detected label for feedback either way.
 */
export function matchQuizRegion(place: ReversePlace | null, flag: Flag): RegionMatch {
  const detected = place?.locality || place?.county || place?.state || '';
  if (!place) return { matched: false, detected: '' };
  const variants = regionVariants(flag);
  if (variants.length === 0) return { matched: false, detected };
  const fields = [place.state, place.county, place.locality].map(normPlace).filter(Boolean);
  for (const v of variants) {
    for (const f of fields) {
      if (fuzzyRegionEquals(v, f)) return { matched: true, detected };
    }
  }
  return { matched: false, detected };
}

/** ReversePlace carries country + countryCode, so it satisfies ReverseCountry. */
export function placeToCountry(place: ReversePlace): { country: string; countryCode: string; displayName: string } {
  return { country: place.country, countryCode: place.countryCode, displayName: place.displayName };
}

/**
 * Strict score for admin regions: correct ONLY on a region match.
 * Country-only hits are explicitly wrong ("right country, wrong region").
 * When nothing resolved at all (open ocean), falls back to distance so a
 * good pin near a tiny island isn't punished for Nominatim having no data.
 */
export function scoreRegionalGuess(
  distanceKm: number,
  insideCountry: boolean,
  regionMatched: boolean,
  detectedPlace: string,
): MapScore {
  if (!detectedPlace && !insideCountry) {
    return { ...scoreMapGuess(distanceKm, false), regionMatched: false, detectedPlace: '' };
  }
  const isCorrect = regionMatched;
  let verdict: MapVerdict;
  if (regionMatched) {
    verdict = distanceKm <= 150 ? 'bullseye' : 'region';
  } else if (insideCountry) {
    verdict = 'wrong-region';
  } else if (distanceKm <= 750) {
    verdict = 'close';
  } else if (distanceKm <= 1500) {
    verdict = 'far';
  } else {
    verdict = 'miss';
  }
  return { distanceKm, insideCountry, isCorrect, verdict, regionMatched, detectedPlace };
}
