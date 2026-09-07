import { Flag, Continent } from '../../types';
import { US_INDIGENOUS_FLAGS } from './united-states';
import { CANADA_INDIGENOUS_FLAGS } from './canada';
import { OCEANIA_INDIGENOUS_FLAGS } from './oceania';
import { LATIN_AMERICA_INDIGENOUS_FLAGS } from './latin-america';
import { EUROPE_INDIGENOUS_FLAGS } from './europe';
import { RUSSIA_INDIGENOUS_FLAGS } from './russia';
import { ASIA_AFRICA_INDIGENOUS_FLAGS } from './asia-africa';

export {
  US_INDIGENOUS_FLAGS,
  CANADA_INDIGENOUS_FLAGS,
  OCEANIA_INDIGENOUS_FLAGS,
  LATIN_AMERICA_INDIGENOUS_FLAGS,
  EUROPE_INDIGENOUS_FLAGS,
  RUSSIA_INDIGENOUS_FLAGS,
  ASIA_AFRICA_INDIGENOUS_FLAGS
};

export const INDIGENOUS_FLAGS: Flag[] = [
  ...US_INDIGENOUS_FLAGS,
  ...CANADA_INDIGENOUS_FLAGS,
  ...OCEANIA_INDIGENOUS_FLAGS,
  ...LATIN_AMERICA_INDIGENOUS_FLAGS,
  ...EUROPE_INDIGENOUS_FLAGS,
  ...RUSSIA_INDIGENOUS_FLAGS,
  ...ASIA_AFRICA_INDIGENOUS_FLAGS
];

export const INDIGENOUS_COUNTRIES: string[] = Array.from(
  new Set(INDIGENOUS_FLAGS.map((f) => f.country || 'Unknown'))
).sort();

const PRIMARY_INDIGENOUS_CONTINENTS: Record<string, Continent> = {
  'United States': 'North America',
  'Canada': 'North America',
  'Chile': 'South America',
  'Bolivia / Peru': 'South America',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Russia': 'Europe',
  'China': 'Asia',
  'Japan': 'Asia',
  'Iraq / Turkey / Iran': 'Asia',
  'North Africa': 'Africa',
  'Western Sahara': 'Africa'
};

export const INDIGENOUS_COUNTRY_CONTINENT_MAP: Record<string, Continent> = INDIGENOUS_FLAGS.reduce((acc, flag) => {
  if (flag.country && flag.continent) {
    if (PRIMARY_INDIGENOUS_CONTINENTS[flag.country]) {
      acc[flag.country] = PRIMARY_INDIGENOUS_CONTINENTS[flag.country];
    } else if (!acc[flag.country]) {
      acc[flag.country] = flag.continent;
    }
  }
  return acc;
}, {} as Record<string, Continent>);

export const INDIGENOUS_COUNTRIES_BY_CONTINENT: Record<Continent, string[]> = Object.entries(
  INDIGENOUS_COUNTRY_CONTINENT_MAP
).reduce(
  (acc, [country, continent]) => {
    if (!acc[continent]) acc[continent] = [];
    if (!acc[continent].includes(country)) {
      acc[continent].push(country);
    }
    return acc;
  },
  {
    'North America': [],
    'South America': [],
    'Europe': [],
    'Asia': [],
    'Africa': [],
    'Oceania': [],
    'Antarctica': [],
    'Fictional Universes': []
  } as Record<Continent, string[]>
);

// Sort each continent's countries alphabetically
Object.keys(INDIGENOUS_COUNTRIES_BY_CONTINENT).forEach((cont) => {
  INDIGENOUS_COUNTRIES_BY_CONTINENT[cont as Continent].sort();
});

export const INDIGENOUS_CONTINENTS: Continent[] = (
  Object.keys(INDIGENOUS_COUNTRIES_BY_CONTINENT) as Continent[]
).filter((cont) => INDIGENOUS_COUNTRIES_BY_CONTINENT[cont].length > 0);
