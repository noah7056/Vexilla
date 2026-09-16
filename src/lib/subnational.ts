import { AdminType, ALL_ADMIN_TYPES, Flag } from '../types';

/** Categories whose flags carry adminType / parentRegion semantics. */
export const SUBNATIONAL_CATEGORIES = ['Provinces & Territories', 'US States'] as const;

export type AdminTypeFilter = AdminType | 'unspecified' | 'All';

/** Special parent-filter value meaning "flags with no parentRegion" (direct-to-country). */
export const NO_PARENT_VALUE = '__none__';

const ADMIN_TYPE_PLURALS: Record<string, string> = {
  state: 'States',
  province: 'Provinces',
  region: 'Regions',
  territory: 'Territories',
  county: 'Counties',
  district: 'Districts',
  municipality: 'Municipalities',
  city: 'Cities',
  town: 'Towns',
  village: 'Villages',
  council: 'Councils',
  governorate: 'Governorates',
  department: 'Departments',
  prefecture: 'Prefectures',
  parish: 'Parishes',
  canton: 'Cantons',
};

/**
 * Context-aware label for the "no parent" filter bucket: when a strict
 * majority of parentless in-scope flags share an adminType, use it
 * ("States" for US states); otherwise fall back to "Top-level".
 * Semantics (NO_PARENT_VALUE) are unchanged — display only.
 */
export function getTopLevelLabel(
  allFlags: Flag[],
  scopeCountries: string[]
): string {
  const scope = new Set(scopeCountries);
  const counts = new Map<string, number>();
  let total = 0;
  for (const f of allFlags) {
    if (!isSubnationalFlag(f)) continue;
    if (scope.size > 0 && !scope.has(getSubnationalCountry(f))) continue;
    if (getParentKey(f)) continue;
    total++;
    const t = getAdminTypeKey(f);
    if (t !== 'unspecified') counts.set(t, (counts.get(t) || 0) + 1);
  }
  if (total === 0) return 'No parent specified';
  let best = '';
  let bestN = 0;
  counts.forEach((n, t) => {
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  });
  if (best && bestN > total / 2) return ADMIN_TYPE_PLURALS[best] || 'Top-level';
  return 'Top-level';
}

export function getAdminTypeKey(flag: Flag): AdminType | 'unspecified' {
  const t = (flag.adminType || '').trim() as AdminType;
  return (ALL_ADMIN_TYPES as string[]).includes(t) ? t : 'unspecified';
}

export function getParentKey(flag: Flag): string {
  return (flag.parentRegion || '').trim();
}

/**
 * Display/scope country for subnational flags.
 * US States flags implicitly belong to "United States" — the editor used to
 * drop `country` for that category, so older custom county/city flags may have
 * it empty. Normalizing here (instead of only on save) repairs counts,
 * grouping, and scope matching for those existing flags.
 */
export function getSubnationalCountry(flag: Flag): string {
  const raw = (flag.country || '').trim();
  if (raw) return raw;
  if (flag.category === 'US States') return 'United States';
  return 'Unknown';
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
// Hierarchical (multi-level) parent support.
//
// Data convention: County parentRegion = State name, City parentRegion =
// County name — even when the county itself has no flag ("phantom parent").
// A city then matches a selected state through its ancestor chain, so picking
// e.g. Texas includes both its counties AND their cities without hand-picking
// every county from the dropdown.
// ---------------------------------------------------------------------------

/** Normalized lookup key for flag-name ↔ parentRegion joins. */
export function normalizeParentName(s: string): string {
  return (s || '').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Manual phantom placements: a flagless county/province ("phantom parent")
// can be assigned under a grandparent (state/region) so it nests tidily even
// though no flag of its name exists. Keys are `country|||phantom` →
// grandparent name. Persisted via FlagsContext (localStorage + Firestore).
// ---------------------------------------------------------------------------

export type ParentLinks = Record<string, string>;

export function parentLinkKey(country: string, phantom: string): string {
  return `${(country || '').trim()}|||${(phantom || '').trim()}`;
}

/** Assigned grandparent for a phantom parent, or '' when unplaced/invalid. */
export function getPhantomPlacement(
  country: string,
  phantom: string,
  links?: ParentLinks
): string {
  const p = (phantom || '').trim();
  if (!p) return '';
  const t = ((links || {})[parentLinkKey(country, p)] || '').trim();
  if (!t || t === p) return '';
  return t;
}

/**
 * All ancestor parentRegion names of `flag`, nearest first, by walking
 * parentRegion → flag-with-that-name links within the same country.
 * Cycle-guarded and depth-capped. Phantom parents (no flag of that name)
 * continue through their manual placement, if assigned — otherwise they
 * terminate the chain (their children still match them directly).
 */
export function getAncestorChain(
  flag: Flag,
  allFlags: Flag[],
  links?: ParentLinks
): string[] {
  const chain: string[] = [];
  const seen = new Set<string>([normalizeParentName(flag.name)]);
  let currentParent = getParentKey(flag);
  // Index candidate parents by normalized name, scoped to the flag's country
  // so e.g. "Harris County" in TX doesn't resolve to the GA namesake when
  // both exist. When same-country duplicates exist, any matching chain counts
  // (see matchesParentsHierarchical) — deterministic order keeps it stable.
  const country = getSubnationalCountry(flag);
  const byName = new Map<string, Flag[]>();
  for (const f of allFlags) {
    if (!isSubnationalFlag(f)) continue;
    if (getSubnationalCountry(f) !== country) continue;
    const nm = (f.name || '').trim();
    if (!nm) continue;
    const k = normalizeParentName(nm);
    const arr = byName.get(k);
    if (arr) arr.push(f);
    else byName.set(k, [f]);
  }
  for (let depth = 0; depth < 5 && currentParent; depth++) {
    const key = normalizeParentName(currentParent);
    if (!key || seen.has(key)) break;
    seen.add(key);
    chain.push(currentParent);
    const candidates = byName.get(key);
    if (candidates && candidates.length > 0) {
      // Follow the first candidate for chain display; matching (below) checks all.
      currentParent = getParentKey(candidates[0]);
      continue;
    }
    // Phantom parent: follow its manual placement, if assigned.
    const placed = getPhantomPlacement(country, currentParent, links);
    if (!placed || seen.has(normalizeParentName(placed))) break;
    currentParent = placed;
  }
  return chain;
}

/**
 * Hierarchical matcher: a flag passes when its own parent OR any ancestor's
 * name is selected. Same empty-parent / NO_PARENT_VALUE semantics as
 * matchesParents. `allFlags` is the full flag pool (for chain resolution).
 */
export function matchesParentsHierarchical(
  flag: Flag,
  selectedParents: string[],
  allFlags: Flag[],
  links?: ParentLinks
): boolean {
  if (!selectedParents || selectedParents.length === 0) return true;
  const key = getParentKey(flag);
  if (key && selectedParents.includes(key)) return true;
  if (!key && selectedParents.includes(NO_PARENT_VALUE)) return true;
  if (!key) return false;
  // Check every candidate chain (handles same-country duplicate names: a
  // city matches if ANY namesake county's ancestry hits the selection).
  const country = getSubnationalCountry(flag);
  const selectedSet = new Set(selectedParents);
  const visited = new Set<string>([normalizeParentName(flag.name)]);
  const queue: string[] = [key];
  for (let depth = 0; depth < 5 && queue.length > 0; depth++) {
    const next: string[] = [];
    for (const name of queue) {
      if (selectedSet.has(name)) return true;
      const nkey = normalizeParentName(name);
      if (!nkey || visited.has(nkey)) continue;
      visited.add(nkey);
      let foundReal = false;
      for (const f of allFlags) {
        if (!isSubnationalFlag(f)) continue;
        if (getSubnationalCountry(f) !== country) continue;
        if (normalizeParentName(f.name) !== nkey) continue;
        foundReal = true;
        const gp = getParentKey(f);
        if (gp) next.push(gp);
      }
      if (!foundReal) {
        // Phantom parent: continue through its manual placement, if assigned.
        const placed = getPhantomPlacement(country, name, links);
        if (placed) next.push(placed);
      }
    }
    queue.length = 0;
    queue.push(...next);
  }
  return false;
}

/** Full "City • County • State" display chain, nearest parent first. */
export function getParentChainLabel(
  flag: Flag,
  allFlags: Flag[],
  links?: ParentLinks
): string {
  const chain = getAncestorChain(flag, allFlags, links);
  return chain.join(' • ');
}

export interface ParentTreeNode {
  country: string;
  name: string;
  /** Flags pointing directly at this node. */
  directCount: number;
  /** Flags in the whole subtree (direct + descendants). */
  totalCount: number;
  /** True when no flag of this name exists (flagless county/province). */
  phantom: boolean;
  children: ParentTreeNode[];
}

export interface ParentTreeGroup {
  country: string;
  roots: ParentTreeNode[];
}

/**
 * Nested parent tree per country for the filter dropdown: top-level regions
 * (flags with no parent) with their children, plus "unplaced" phantom parents
 * (referenced names with no flag and no manual placement — shown at root level
 * so they stay selectable; assigning them a state, or adding the real county
 * flag, snaps them into place).
 * `totalCount` drives the chip counts so selecting a state reads as
 * "everything under it".
 */
export function getParentTree(
  flags: Flag[],
  scopeCountries: string[],
  links?: ParentLinks
): ParentTreeGroup[] {
  const scope = new Set(scopeCountries);
  const inScope = flags.filter(
    (f) =>
      isSubnationalFlag(f) &&
      (scope.size === 0 || scope.has(getSubnationalCountry(f)))
  );
  const byCountry = new Map<string, Flag[]>();
  inScope.forEach((f) => {
    const c = getSubnationalCountry(f);
    const arr = byCountry.get(c);
    if (arr) arr.push(f);
    else byCountry.set(c, [f]);
  });

  return Array.from(byCountry.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([country, list]) => {
      const nameToFlags = new Map<string, Flag[]>();
      const childrenOf = new Map<string, Flag[]>();
      list.forEach((f) => {
        const nm = (f.name || '').trim();
        if (nm) {
          const arr = nameToFlags.get(nm);
          if (arr) arr.push(f);
          else nameToFlags.set(nm, [f]);
        }
        const p = getParentKey(f);
        if (p) {
          const arr = childrenOf.get(p);
          if (arr) arr.push(f);
          else childrenOf.set(p, [f]);
        }
      });

      const memo = new Map<string, number>();
      // Manual phantom placements valid for this country: phantom → real
      // grandparent flag. Rejected when the target isn't a real region or the
      // target's ancestry loops back through the phantom (would cycle).
      const placedUnder = new Map<string, string>();
      childrenOf.forEach((_kids, parentName) => {
        if (nameToFlags.has(parentName)) return; // real, not phantom
        const target = getPhantomPlacement(country, parentName, links);
        if (!target || !nameToFlags.has(target) || target === parentName) return;
        // Walk the target's ancestry (real parents + other placements);
        // invalid if it passes back through this phantom.
        const want = normalizeParentName(parentName);
        const seenUp = new Set<string>();
        let cur: string | undefined = target;
        let ok = true;
        for (let d = 0; d < 6 && cur; d++) {
          const ck = normalizeParentName(cur);
          if (ck === want || seenUp.has(ck)) {
            ok = false;
            break;
          }
          seenUp.add(ck);
          const real = nameToFlags.get(cur);
          if (real && real.length > 0) {
            cur = getParentKey(real[0]) || undefined;
          } else {
            cur = getPhantomPlacement(country, cur, links) || undefined;
          }
        }
        if (ok) placedUnder.set(parentName, target);
      });

      const totalUnder = (name: string, seen: Set<string>): number => {
        if (seen.has(name)) return 0;
        if (memo.has(name)) return memo.get(name)!;
        seen.add(name);
        let n = (childrenOf.get(name) || []).length;
        (childrenOf.get(name) || []).forEach((child) => {
          const cn = (child.name || '').trim();
          if (cn) n += totalUnder(cn, seen);
        });
        // Subtrees of phantoms manually placed under this node.
        placedUnder.forEach((target, phantom) => {
          if (target === name) n += totalUnder(phantom, seen);
        });
        seen.delete(name);
        memo.set(name, n);
        return n;
      };

      const buildNode = (name: string, seen: Set<string>): ParentTreeNode => {
        const kids = new Map<string, Flag[]>();
        (childrenOf.get(name) || []).forEach((child) => {
          const cn = (child.name || '').trim();
          if (!cn) return;
          // Only nest real sub-regions (flags that are themselves parents);
          // leaf cities stay counted, not nested, to keep the tree 2 deep.
          if (childrenOf.has(cn) && !seen.has(cn)) {
            const arr = kids.get(cn);
            if (arr) arr.push(child);
            else kids.set(cn, [child]);
          }
        });
        const childNames = Array.from(kids.keys()).sort((a, b) =>
          a.localeCompare(b)
        );
        // Manually placed phantoms nest under their assigned grandparent.
        placedUnder.forEach((target, phantom) => {
          if (target === name && !seen.has(phantom) && !childNames.includes(phantom)) {
            childNames.push(phantom);
          }
        });
        childNames.sort((a, b) => a.localeCompare(b));
        const childSeen = new Set(seen);
        childSeen.add(name);
        return {
          country,
          name,
          directCount: (childrenOf.get(name) || []).length,
          totalCount: totalUnder(name, new Set()),
          phantom: !nameToFlags.has(name),
          children: childNames.map((cn) => buildNode(cn, childSeen)),
        };
      };

      // Roots: real top-level regions (flags with no parent) + phantoms with
      // no valid manual placement. Placed phantoms nest under their assigned
      // grandparent instead. Real mid-level regions (counties with a parent)
      // qualify for neither, so they nest under their parent. Unparented data
      // (nothing parented yet) degrades to a flat root list.
      const rootNames = new Set<string>();
      list.forEach((f) => {
        if (!getParentKey(f)) {
          const nm = (f.name || '').trim();
          if (nm) rootNames.add(nm);
        }
      });
      childrenOf.forEach((_kids, parentName) => {
        if (!nameToFlags.has(parentName) && !placedUnder.has(parentName)) {
          rootNames.add(parentName); // unplaced phantom
        }
      });

      const roots = Array.from(rootNames)
        .sort((a, b) => {
          const aReal = nameToFlags.has(a) ? 0 : 1;
          const bReal = nameToFlags.has(b) ? 0 : 1;
          if (aReal !== bReal) return aReal - bReal;
          return a.localeCompare(b);
        })
        .map((n) => buildNode(n, new Set()));
      return { country, roots };
    });
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
    const country = getSubnationalCountry(f);
    if (scope.size > 0 && !scope.has(country)) return;
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
    if (scope.size > 0 && !scope.has(getSubnationalCountry(f))) return;
    const k = getAdminTypeKey(f);
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  return counts;
}
