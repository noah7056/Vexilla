import { Flag } from '../types';

/**
 * Custom and user-edited flags baked directly into the codebase.
 * Any flag here is permanently incorporated into the application's built-in flags.
 */
export const BUILTIN_CUSTOM_FLAGS: Flag[] = [];

/**
 * Flag IDs permanently deleted by user, baked directly into the codebase.
 * Any flag ID here is permanently excluded from the application's built-in flags.
 */
export const BUILTIN_DELETED_FLAG_IDS: string[] = [];
