import { Flag } from '../../types';
import { CONSTRUCTED_LANGUAGES } from './constructed';
import { INTERNATIONAL_LANGUAGES } from './international';
import { REGIONAL_LANGUAGES } from './regional';

export {
  CONSTRUCTED_LANGUAGES,
  INTERNATIONAL_LANGUAGES,
  REGIONAL_LANGUAGES
};

export const LANGUAGE_FLAGS: Flag[] = [
  ...CONSTRUCTED_LANGUAGES,
  ...INTERNATIONAL_LANGUAGES,
  ...REGIONAL_LANGUAGES
];

export const LANGUAGE_COUNTRIES = Array.from(
  new Set(LANGUAGE_FLAGS.map(f => f.country || 'Unknown'))
).sort();
