import { Flag, Continent } from '../../types';
import { INTERNATIONAL_ORG_FLAGS } from './international';
import { AFRICA_ORG_FLAGS } from './africa';
import { ASIA_ORG_FLAGS } from './asia';
import { EUROPE_ORG_FLAGS } from './europe';
import { AMERICAS_ORG_FLAGS } from './americas';
import { OCEANIA_ORG_FLAGS } from './oceania';

export {
  INTERNATIONAL_ORG_FLAGS,
  AFRICA_ORG_FLAGS,
  ASIA_ORG_FLAGS,
  EUROPE_ORG_FLAGS,
  AMERICAS_ORG_FLAGS,
  OCEANIA_ORG_FLAGS
};

export const ORGANIZATION_FLAGS: Flag[] = [
  ...INTERNATIONAL_ORG_FLAGS,
  ...AFRICA_ORG_FLAGS,
  ...ASIA_ORG_FLAGS,
  ...EUROPE_ORG_FLAGS,
  ...AMERICAS_ORG_FLAGS,
  ...OCEANIA_ORG_FLAGS
];

export const ORGANIZATION_COUNTRIES: string[] = Array.from(
  new Set(ORGANIZATION_FLAGS.map((f) => f.country || 'Unknown'))
).sort();

const PRIMARY_ORG_CONTINENTS: Record<string, Continent> = {
  'International': 'International',
  'Africa': 'Africa',
  'Asia': 'Asia',
  'Europe': 'Europe',
  'Americas': 'North America',
  'Oceania': 'Oceania'
};

export const ORGANIZATION_COUNTRY_CONTINENT_MAP: Record<string, Continent> = ORGANIZATION_FLAGS.reduce((acc, flag) => {
  if (flag.country && flag.continent) {
    if (PRIMARY_ORG_CONTINENTS[flag.country]) {
      acc[flag.country] = PRIMARY_ORG_CONTINENTS[flag.country];
    } else if (!acc[flag.country]) {
      acc[flag.country] = flag.continent;
    }
  }
  return acc;
}, {} as Record<string, Continent>);

export const ORGANIZATION_COUNTRIES_BY_CONTINENT: Record<Continent, string[]> = Object.entries(
  ORGANIZATION_COUNTRY_CONTINENT_MAP
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
    'Fictional Universes': [],
    'International': []
  } as Record<Continent, string[]>
);

Object.keys(ORGANIZATION_COUNTRIES_BY_CONTINENT).forEach((cont) => {
  ORGANIZATION_COUNTRIES_BY_CONTINENT[cont as Continent].sort();
});

export const ORGANIZATION_CONTINENTS: Continent[] = (
  Object.keys(ORGANIZATION_COUNTRIES_BY_CONTINENT) as Continent[]
).filter((cont) => ORGANIZATION_COUNTRIES_BY_CONTINENT[cont].length > 0);
