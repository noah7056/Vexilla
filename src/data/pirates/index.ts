import { HISTORICAL_PIRATE_FLAGS } from './historical';
import { REGIONAL_PIRATE_FLAGS } from './regional';

export * from './utils';
export * from './historical';
export * from './regional';

export const PIRATE_FLAGS = [
  ...HISTORICAL_PIRATE_FLAGS,
  ...REGIONAL_PIRATE_FLAGS
];
