import { AdminType, ALL_ADMIN_TYPES, Flag } from '../types';

/** Categories whose flags carry adminType / parentRegion semantics. */
export const SUBNATIONAL_CATEGORIES = ['Provinces & Territories', 'US States'] as const;

export type AdminTypeFilter = AdminType | 'unspecified' | 'All';

/** Special parent-filter value meaning "flags with no parentRegion" (direct-to-country). */
export const NO_PARENT_VALUE = '__none__';

export function getAdminTypeKey(flag: Flag): AdminType | 'unspecified' {
  const t = (flag.adminType || '').trim() as AdminType;
  return (ALL_ADMIN_TYPES as string[]).includes(t) ? t : 'unspecified';
}

export function getParentKey(flag: Flag): string {
  return (flag.parentRegion || '').trim();
}

export function isSubnationalFlag(flag: Flag): boolean {
  return (SUBNATIONAL_CATEGORIES as readonly string[]).includes(flag.category);
}

/**
 * AND-semantics matcher: flag passes when its type key is in the selection.
 * Empty/'All' selection passes everything. Missing adminType counts as 'unspecified'.
 * Applied globally (same precedent as the Status filter).
 */
export function matchesAdminTypes(
  flag: Flag,
  selected: (AdminType | 'unspecified' | 'All')[]
): boolean {
  if (!selected || selected.length === 0 || selected.includes('All')) return true;
  return (selected as string[]).includes(getAdminTypeKey(flag));
}

/**
 * Strict AND-semantics matcher agreed with the user: when parents are selected,
 * flags with an empty parent do NOT match unless NO_PARENT_VALUE is explicitly
 * selected. Empty selection passes everything.
 */
export function matchesParents(flag: Flag, selectedParents: string[]): boolean {
  if (!selectedParents || selectedParents.length === 0) return true;
  const key = getParentKey(flag);
  if (key && selectedParents.includes(key)) return true;
  if (!key && selectedParents.includes(NO_PARENT_VALUE)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// High-precision (100% certain only) adminType classifier.
// Used by the local codemod script AND the in-app cloud classify tool so both
// stores share identical rules. Parent is NEVER inferred — manual only.
// ---------------------------------------------------------------------------

export interface ClassifyResult {
  adminType?: AdminType;
  confident: boolean;
  reason?: string;
}

// Extracts the real image filename from plain filenames, direct URLs, and
// multi-segment URLs (e.g. Wikia `.../Flag_X.svg/revision/latest?cb=...`).
export function imageFilename(image?: string): string {
  const raw = image || '';
  if (!raw) return '';
  if (!raw.includes('/')) return raw.split('?')[0];
  const segs = raw.split('?')[0].split('/');
  for (let i = segs.length - 1; i >= 0; i--) {
    if (/\.(svg|png|jpe?g|webp|gif|tif?f|bmp)$/i.test(segs[i])) return segs[i];
  }
  return segs[segs.length - 1] || '';
}

const SIGNAL_PATTERNS: { type: AdminType; patterns: RegExp[] }[] = [  { type: 'council', patterns: [/\bcouncil\b/i] },
  { type: 'municipality', patterns: [/\bmunicip\w*/i] },
  { type: 'county', patterns: [/\bcounty\b/i, /\bcounties\b/i] },
  { type: 'district', patterns: [/\bdistrict\b/i] },
  { type: 'parish', patterns: [/\bparish\b/i] },
  { type: 'canton', patterns: [/\bcanton\b/i] },
  { type: 'governorate', patterns: [/\bgovernorate\b/i] },
  { type: 'province', patterns: [/\bprovince\b/i] },
  { type: 'state', patterns: [/\bstate\b/i] },
  { type: 'region', patterns: [/\bregion\b/i] },
  { type: 'territory', patterns: [/\bterritor\w*/i] },
  { type: 'department', patterns: [/\bdepartment\b/i] },
  { type: 'prefecture', patterns: [/\bprefecture\b/i] },
  { type: 'town', patterns: [/\btown\b/i] },
  { type: 'village', patterns: [/\bvillage\b/i] },
  { type: 'city', patterns: [/\bcity\b/i] },
];

/**
 * Returns a confident adminType only when exactly ONE signal fires across
 * name + image filename. Ambiguous (e.g. "City and County of Honolulu") or
 * signal-free inputs return { confident: false } and must be left unspecified.
 *
 * Precedence: an explicit "X Council" body name (e.g. "Municipal Council of
 * Macau") resolves to council even though "municipal" also fires.
 */
export function classifyAdminType(name: string, image?: string): ClassifyResult {
  const hayName = ` ${name || ''} `;
  if (/\b(municipal|city|town|village|county|district|regional)\s+council\b/i.test(hayName)) {
    return { adminType: 'council', confident: true, reason: 'name contains "<unit> council"' };
  }
  const imgFile = imageFilename(image);
  const hayImg = ` ${imgFile.replace(/[_-]+/g, ' ')} `;
  const fired = new Map<AdminType, string>();

  for (const { type, patterns } of SIGNAL_PATTERNS) {
    for (const re of patterns) {
      if (re.test(hayName)) {
        fired.set(type, `name matches ${re}`);
        break;
      }
    }
    if (!fired.has(type)) {
      for (const re of patterns) {
        if (re.test(hayImg)) {
          fired.set(type, `image filename matches ${re}`);
          break;
        }
      }
    }
  }

  if (fired.size === 1) {
    const [[type, reason]] = Array.from(fired.entries());
    return { adminType: type, confident: true, reason };
  }
  if (fired.size === 0) return { confident: false, reason: 'no signal' };
  return { confident: false, reason: `ambiguous: ${Array.from(fired.keys()).join('+')}` };
}

// ---------------------------------------------------------------------------
// Dropdown option derivation
// ---------------------------------------------------------------------------

export interface ParentOption {
  country: string;
  parent: string; // NO_PARENT_VALUE for the empty bucket
  label: string;
  count: number;
}

export interface ParentOptionsResult {
  opts: ParentOption[];
  noneCount: number;
  noneByCountry: Map<string, number>;
}

/**
 * Parent dropdown options scoped to the given countries.
 *
 * `opts` contains every subnational flag name in scope as a parent candidate
 * (count = how many flags reference it as parentRegion, 0 when none do yet),
 * plus any referenced parentRegion values that aren't flags themselves.
 * Zero-count entries are intentional: they bootstrap the parenting workflow —
 * pick a region now, assign its municipalities in the editor, counts follow.
 */
export function getParentOptionsDetailed(
  flags: Flag[],
  scopeCountries: string[]
): ParentOptionsResult {
  const scope = new Set(scopeCountries);
  const refCount = new Map<string, number>();
  let noneCount = 0;
  const noneByCountry = new Map<string, number>();
  const names = new Set<string>();
  flags.forEach((f) => {
    if (!isSubnationalFlag(f)) return;
    const country = (f.country || '').trim() || 'Unknown';
    if (scope.size > 0 && !scope.has((f.country || '').trim())) return;
    const key = getParentKey(f);
    if (key) {
      const k = `${country}|||${key}`;
      refCount.set(k, (refCount.get(k) || 0) + 1);
    } else {
      noneCount += 1;
      noneByCountry.set(country, (noneByCountry.get(country) || 0) + 1);
    }
    const nm = (f.name || '').trim();
    if (nm) names.add(`${country}|||${nm}`);
  });
  const keys = Array.from(new Set([...refCount.keys(), ...names])).sort((a, b) =>
    a.localeCompare(b)
  );
  const opts: ParentOption[] = keys.map((k) => {
    const sep = k.indexOf('|||');
    const country = k.slice(0, sep);
    const parent = k.slice(sep + 3);
    return { country, parent, label: parent, count: refCount.get(k) || 0 };
  });
  return { opts, noneCount, noneByCountry };
}

/** Type counts for the Type dropdown, scoped to the given countries (empty = all subnational). */
export function getAdminTypeCounts(
  flags: Flag[],
  scopeCountries: string[]
): Map<AdminType | 'unspecified', number> {
  const scope = new Set(scopeCountries);
  const counts = new Map<AdminType | 'unspecified', number>();
  flags.forEach((f) => {
    if (!isSubnationalFlag(f)) return;
    if (scope.size > 0 && !(f.country && scope.has(f.country))) return;
    const k = getAdminTypeKey(f);
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  return counts;
}
