export type Category = 
  | 'Sovereign States' 
  | 'Non-Sovereign & Unrecognized' 
  | 'US States' 
  | 'Provinces & Territories'
  | 'Fictional'
  | 'Indigenous & Cultural Populations'
  | 'LGBTQI+'
  | 'Languages'
  | 'Pirate Flags'
  | 'Organizations'
  | 'Concepts';

export const ALL_CATEGORIES: Category[] = [
  'Sovereign States',
  'Non-Sovereign & Unrecognized',
  'US States',
  'Provinces & Territories',
  'Fictional',
  'Indigenous & Cultural Populations',
  'LGBTQI+',
  'Languages',
  'Pirate Flags',
  'Organizations',
  'Concepts'
];

export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'
  | 'Antarctica'
  | 'Fictional Universes'
  | 'Global'
  // Section-grouping values stored in `continent` for the Concepts category
  // (precedent: 'Global' and 'Fictional Universes' are also non-geographic).
  // Kept out of ALL_CONTINENTS so continent pickers stay geographic-only.
  | 'Concepts'
  | 'Experiments'
  | 'Community'
  | 'Personal';

export const ALL_CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica'
];

export type FlagStatus =
  | 'official'
  | 'unofficial'
  | 'historical'
  | 'proposed'
  | 'fictional'
  | 'fan-made'
  | 'obsolete'
  | 'variant'
  | 'disputed'
  | 'ceremonial';

export type MasteryLevel = 'mastered' | 'learning' | 'needs-practice' | 'unattempted';
export type MasteryFilter = 'all' | MasteryLevel;

export const ALL_MASTERY_LEVELS: MasteryLevel[] = [
  'mastered',
  'learning',
  'needs-practice',
  'unattempted'
];

export function getFlagMasteryLevel(flagId: string, progress?: Record<string, FlagProgress>): MasteryLevel {
  const p = progress?.[flagId];
  if (!p || p.attempts === 0) return 'unattempted';
  const correct = p.correct || 0;
  const attempts = p.attempts || 0;
  const acc = attempts > 0 ? correct / attempts : 0;
  if (correct >= 2) return 'mastered';
  if (acc < 0.5) return 'needs-practice';
  return 'learning';
}

export const ALL_STATUSES: FlagStatus[] = [
  'official',
  'unofficial',
  'historical',
  'proposed',
  'fictional',
  'fan-made',
  'obsolete',
  'variant',
  'disputed',
  'ceremonial'
];

export type GeoLevel =
  | 'country'
  | 'state'
  | 'province'
  | 'city'
  | 'region'
  | 'culture'
  | 'non-geo';

export interface Flag {
  id: string;
  name: string;
  code: string; // ISO 3166-1 alpha-2 or 3166-2 code for flagcdn
  category: Category;
  continent?: Continent;
  country?: string; // Country association (e.g. for Provinces & Territories: Canada, China, Russia, United Kingdom)
  imageUrl?: string;
  aliases?: string[]; // Alternative search terms (e.g. ["USA", "America"])
  tags?: string[]; // Descriptors & motifs (e.g. ["green", "bird", "star", "stripes", "cross"])
  status?: FlagStatus | ''; // Official status / designation of the flag
  creator?: string; // Name or username of creator (for fan-made flags / origin)
  sourceUrl?: string; // Generic link to creator's page, flag info page, origin post, etc.
  // --- Optional geography (Atlas map). All optional so Firestore docs without
  // them keep working; `cleanObject` in FlagsContext strips undefined on save.
  lat?: number;
  lon?: number;
  bbox?: [south: number, west: number, north: number, east: number];
  geoLevel?: GeoLevel;
  geoApprox?: boolean; // true = parent-centroid fallback, show hollow style + disclaimer
}

export interface FlagProgress {
  flagId: string;
  attempts: number;
  correct: number;
  lastAttemptedAt: string | null;
}

export type ViewMode = 'dictionary' | 'atlas' | 'flashcards' | 'quiz' | 'progress' | 'collections';

export type QuizMode =
  | 'flag-to-name'
  | 'name-to-flag'
  | 'flag-to-map'
  | 'name-to-map'
  | 'map-to-flag'
  | 'true-false'
  | 'flag-to-origin';

export interface QuizConfig {
  mode: QuizMode;
  questionCount: number | 'all';
  categories: Category[];
  continents: Continent[];
  provinceCountry?: string; // 'All' or specific country like 'Canada', 'Russia', 'China', 'United Kingdom'
  fictionalUniverse?: string;
  lgbtqiSubcategory?: string; // 'All' or specific universe like 'Star Wars', 'Star Trek'
  indigenousCountry?: string; // 'All' or specific country/region like 'United States', 'New Zealand'
  regionCountry?: string;
  selectedSubOptions?: Record<string, string[]>;
  statuses?: (FlagStatus | 'unspecified' | 'All')[];
  tags?: string[];
  mastery?: (MasteryLevel | 'all')[];
  optionCount: 2 | 4 | 6;
  showCountryHintAfterAnswer?: boolean;
  showCountryInQuestion?: boolean;
  showCountryInOptions?: boolean;
  waitTimeAfterAnswer?: number;
}

export interface QuizQuestionResult {
  flag: Flag;
  selectedFlagId: string;
  isCorrect: boolean;
  /** Map-guess modes: distance from guess pin to true location (km). */
  distanceKm?: number;
  /** Map-guess modes: reverse-geocoded click landed inside the expected country. */
  insideCountry?: boolean;
  /** Map-guess modes: most specific detected locality (region scoring). */
  detectedPlace?: string;
  /** Map-guess modes: where the user clicked. */
  guessLat?: number;
  guessLon?: number;
  /** True/False mode: the name that was proposed alongside the flag. */
  proposedName?: string;
  /** Origin mode: the correct answer (continent or parent country). */
  originAnswer?: string;
}

export interface QuizPreset {
  id: string;
  name: string;
  createdAt: number;
  config: QuizConfig;
}

export interface TrashItem {
  flag: Flag;
  deletedAt: number;
  isCustom: boolean;
}
