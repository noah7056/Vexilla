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
  | 'Organizations';

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
  'Organizations'
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
  | 'Global';

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
}

export interface FlagProgress {
  flagId: string;
  attempts: number;
  correct: number;
  lastAttemptedAt: string | null;
}

export type ViewMode = 'dictionary' | 'flashcards' | 'quiz' | 'progress' | 'collections';

export type QuizMode = 'flag-to-name' | 'name-to-flag';

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
}

export interface TrashItem {
  flag: Flag;
  deletedAt: number;
  isCustom: boolean;
}
