import { Flag } from '../../types';
import { ORIENTATION_FLAGS } from './orientations';
import { GENDER_FLAGS } from './gender';
import { SUBCULTURE_FLAGS } from './subcultures';

export {
  ORIENTATION_FLAGS,
  GENDER_FLAGS,
  SUBCULTURE_FLAGS
};

export const LGBTQ_FLAGS: Flag[] = [
  ...ORIENTATION_FLAGS,
  ...GENDER_FLAGS,
  ...SUBCULTURE_FLAGS
];
