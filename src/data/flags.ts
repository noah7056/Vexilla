import { Flag } from '../types';
import {
  SOVEREIGN_FLAGS,
  NON_SOVEREIGN_FLAGS,
  US_STATE_FLAGS
} from './countries';
import {
  PROVINCES_AND_TERRITORIES_FLAGS,
  PROVINCE_COUNTRIES as RAW_PROVINCE_COUNTRIES,
  PROVINCE_COUNTRY_CONTINENT_MAP as RAW_PROVINCE_COUNTRY_CONTINENT_MAP,
  PROVINCE_COUNTRIES_BY_CONTINENT as RAW_PROVINCE_COUNTRIES_BY_CONTINENT,
  PROVINCE_CONTINENTS as RAW_PROVINCE_CONTINENTS
} from './provinces';
import {
  FICTIONAL_FLAGS,
  FICTIONAL_UNIVERSES
} from './fictional';
import {
  INDIGENOUS_FLAGS,
  INDIGENOUS_COUNTRIES,
  INDIGENOUS_COUNTRY_CONTINENT_MAP,
  INDIGENOUS_COUNTRIES_BY_CONTINENT,
  INDIGENOUS_CONTINENTS
} from './indigenous';
import { LGBTQ_FLAGS } from './lgbtq';
import { LANGUAGE_FLAGS } from './languages';
import { PIRATE_FLAGS } from './pirates';
import {
  ORGANIZATION_FLAGS,
  ORGANIZATION_COUNTRIES,
  ORGANIZATION_COUNTRY_CONTINENT_MAP,
  ORGANIZATION_COUNTRIES_BY_CONTINENT,
  ORGANIZATION_CONTINENTS
} from './organizations';
import { BUILTIN_CUSTOM_FLAGS, BUILTIN_DELETED_FLAG_IDS } from './customFlagsData';

const ALL_PROVINCES = [
  ...PROVINCES_AND_TERRITORIES_FLAGS,
  ...BUILTIN_CUSTOM_FLAGS.filter(f => f.category === 'Provinces & Territories')
];

export const PROVINCE_COUNTRIES = Array.from(new Set(ALL_PROVINCES.map((f) => f.country || 'Unknown'))).sort();

export const PROVINCE_COUNTRY_CONTINENT_MAP = ALL_PROVINCES.reduce((acc, flag) => {
  if (flag.country && flag.continent) {
    if (!acc[flag.country]) {
      acc[flag.country] = flag.continent;
    }
  }
  return acc;
}, { ...RAW_PROVINCE_COUNTRY_CONTINENT_MAP } as Record<string, string>);

export const PROVINCE_COUNTRIES_BY_CONTINENT = Object.entries(PROVINCE_COUNTRY_CONTINENT_MAP).reduce((acc, [country, continent]) => {
  if (!acc[continent]) acc[continent] = [];
  if (!acc[continent].includes(country)) {
    acc[continent].push(country);
  }
  return acc;
}, { ...RAW_PROVINCE_COUNTRIES_BY_CONTINENT } as Record<string, string[]>);

export const PROVINCE_CONTINENTS = Object.keys(PROVINCE_COUNTRIES_BY_CONTINENT).sort();

export {
  SOVEREIGN_FLAGS,
  NON_SOVEREIGN_FLAGS,
  US_STATE_FLAGS,
  FICTIONAL_FLAGS,
  FICTIONAL_UNIVERSES,
  INDIGENOUS_FLAGS,
  INDIGENOUS_COUNTRIES,
  INDIGENOUS_COUNTRY_CONTINENT_MAP,
  INDIGENOUS_COUNTRIES_BY_CONTINENT,
  INDIGENOUS_CONTINENTS,
  LGBTQ_FLAGS,
  LANGUAGE_FLAGS,
  PIRATE_FLAGS,
  ORGANIZATION_FLAGS,
  ORGANIZATION_COUNTRIES,
  ORGANIZATION_COUNTRY_CONTINENT_MAP,
  ORGANIZATION_COUNTRIES_BY_CONTINENT,
  ORGANIZATION_CONTINENTS,
  BUILTIN_CUSTOM_FLAGS,
  BUILTIN_DELETED_FLAG_IDS
};

export const BASE_FLAGS: Flag[] = [
  ...SOVEREIGN_FLAGS,
  ...NON_SOVEREIGN_FLAGS,
  ...US_STATE_FLAGS,
  ...PROVINCES_AND_TERRITORIES_FLAGS,
  ...FICTIONAL_FLAGS,
  ...INDIGENOUS_FLAGS,
  ...LGBTQ_FLAGS,
  ...LANGUAGE_FLAGS,
  ...PIRATE_FLAGS,
  ...ORGANIZATION_FLAGS
];

// Combine base flags with baked custom flags, allowing custom flags to add new entries or override existing ones
const flagsMap = new Map<string, Flag>();
BASE_FLAGS.forEach(flag => flagsMap.set(flag.id, flag));
BUILTIN_CUSTOM_FLAGS.forEach(customFlag => flagsMap.set(customFlag.id, customFlag));

const deletedSet = new Set(BUILTIN_DELETED_FLAG_IDS);
export const FLAGS: Flag[] = Array.from(flagsMap.values()).filter(flag => !deletedSet.has(flag.id));

export const getFlagImageUrl = (flag: Flag, highRes: boolean = false) => {
  if (flag.imageUrl) {
    let url = flag.imageUrl.trim();

    // Handle MediaWiki URLs that point to the wiki HTML page instead of the image file
    // 1. /wiki/...#/media/File:Filename
    const mediaFileMatch = url.match(/(https?:\/\/[^\/]+)\/wiki\/.*#\/media\/File:(.+)$/);
    if (mediaFileMatch) {
      url = `${mediaFileMatch[1]}/wiki/Special:FilePath/${mediaFileMatch[2]}`;
    } 
    // 2. /wiki/...?file=Filename
    else if (url.includes('?file=')) {
      const parts = url.split('?file=');
      const domainMatch = parts[0].match(/(https?:\/\/[^\/]+)\/(?:wiki|w)\//);
      if (domainMatch) {
        url = `${domainMatch[1]}/wiki/Special:FilePath/${parts[1]}`;
      }
    }
    // 3. /wiki/File:Filename
    else {
      const fileMatch = url.match(/(https?:\/\/[^\/]+)\/wiki\/File:(.+)$/);
      if (fileMatch) {
        url = `${fileMatch[1]}/wiki/Special:FilePath/${fileMatch[2]}`;
      }
    }

    // Imgur direct page fallback: https://imgur.com/xyz -> https://i.imgur.com/xyz.png
    const imgurMatch = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/);
    if (imgurMatch) {
      return `https://i.imgur.com/${imgurMatch[1]}.png`;
    }

    if (url !== flag.imageUrl.trim()) {
      // Valid MediaWiki normalized URL, we can append width for optimization
      const width = highRes ? 800 : 320;
      return `${url}?width=${width}`;
    }

    // If it's just a raw filename (no http), resolve it to a Wikimedia Commons URL immediately
    // This saves a failed network request and an onError retry
    if (!url.startsWith('http')) {
      const width = highRes ? 800 : 320;
      return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${url}&width=${width}`;
    }
    return url;
  }
  const size = highRes ? 'w1280' : 'w320';
  return `https://flagcdn.com/${size}/${flag.code.toLowerCase().trim()}.png`;
};
