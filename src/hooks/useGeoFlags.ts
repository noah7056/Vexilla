import { useMemo } from 'react';
import { Flag, GeoLevel } from '../types';
import { bucketFlags, GeoBuckets } from '../lib/geo';

export interface GeoPoint {
  flag: Flag;
  lat: number;
  lon: number;
  approx: boolean;
  level: GeoLevel;
}

export interface GeoFilter {
  search: string;
  category: string; // 'All' or category name
  level: string; // 'All' | GeoLevel
  showApprox: boolean;
}

export function applyGeoFilter(
  buckets: GeoBuckets,
  filter: GeoFilter
): { points: GeoPoint[]; unmapped: Flag[] } {
  const q = filter.search.trim().toLowerCase();
  const matchText = (f: Flag) =>
    !q ||
    f.name.toLowerCase().includes(q) ||
    (f.country || '').toLowerCase().includes(q) ||
    (f.code || '').toLowerCase().includes(q) ||
    (f.aliases || []).some((a) => a.toLowerCase().includes(q));
  const matchCat = (f: Flag) => filter.category === 'All' || f.category === filter.category;

  const points: GeoPoint[] = [];
  for (const e of buckets.mapped) {
    if (!matchCat(e.flag) || !matchText(e.flag)) continue;
    if (filter.level !== 'All' && e.geo.geoLevel !== filter.level) continue;
    points.push({ flag: e.flag, lat: e.geo.lat, lon: e.geo.lon, approx: false, level: e.geo.geoLevel });
  }
  if (filter.showApprox) {
    for (const e of buckets.approx) {
      if (!matchCat(e.flag) || !matchText(e.flag)) continue;
      if (filter.level !== 'All' && e.geo.geoLevel !== filter.level) continue;
      points.push({ flag: e.flag, lat: e.geo.lat, lon: e.geo.lon, approx: true, level: e.geo.geoLevel });
    }
  }
  const unmapped = buckets.unmapped.filter((f) => matchCat(f) && matchText(f));
  return { points, unmapped };
}

export function useGeoBuckets(flags: Flag[]): GeoBuckets {
  return useMemo(() => bucketFlags(flags), [flags]);
}
