import { Flag } from '../types';

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

export type MapVerdict = 'bullseye' | 'country' | 'close' | 'far' | 'miss';

/** Distance (km) inside which a guess counts even without a country match. */
export const MAP_PIN_TOLERANCE_KM = 300;

export interface MapScore {
  distanceKm: number;
  insideCountry: boolean;
  isCorrect: boolean;
  verdict: MapVerdict;
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
  close: 'Close — wrong country',
  far: 'Far off',
  miss: 'Missed',
};
