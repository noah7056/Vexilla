import { Flag } from '../../types';
import { CONCEPT_FLAGS } from './concepts';
import { EXPERIMENT_FLAGS } from './experiments';
import { COMMUNITY_FLAGS } from './community';
import { PERSONAL_FLAGS } from './personal';

export {
  CONCEPT_FLAGS,
  EXPERIMENT_FLAGS,
  COMMUNITY_FLAGS,
  PERSONAL_FLAGS
};

export const CONCEPT_CATEGORY_FLAGS: Flag[] = [
  ...CONCEPT_FLAGS,
  ...EXPERIMENT_FLAGS,
  ...COMMUNITY_FLAGS,
  ...PERSONAL_FLAGS
];

/** Canonical sub-sections of the Concepts category. Always shown even when empty. */
export const CONCEPT_SECTIONS = ['Concepts', 'Experiments', 'Community', 'Personal'] as const;
export type ConceptSection = (typeof CONCEPT_SECTIONS)[number];

export const CONCEPT_COUNTRIES = Array.from(
  new Set(CONCEPT_CATEGORY_FLAGS.map(f => f.country || 'Unknown'))
).sort();
