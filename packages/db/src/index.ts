import { drizzle } from 'drizzle-orm/d1';

import * as schema from './schema';

export * as schema from './schema';
export * from './schema';

/**
 * Builds a Drizzle client over a D1 binding. Workers get a fresh binding per
 * request, so call this per request rather than holding a module-level client.
 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema, casing: 'snake_case' });
}

export type Database = ReturnType<typeof createDb>;
