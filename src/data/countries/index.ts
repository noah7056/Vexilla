import { Flag } from '../../types';
import { SOVEREIGN_FLAGS } from './sovereign';
import { NON_SOVEREIGN_FLAGS } from './unrecognized';
import { US_STATE_FLAGS } from './us-states';

export {
  SOVEREIGN_FLAGS,
  NON_SOVEREIGN_FLAGS,
  US_STATE_FLAGS
};

export const ALL_COUNTRY_FLAGS: Flag[] = [
  ...SOVEREIGN_FLAGS,
  ...NON_SOVEREIGN_FLAGS,
  ...US_STATE_FLAGS
];
