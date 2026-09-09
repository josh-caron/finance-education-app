import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Fixed-window request counters, one row per key.
 *
 * D1 rather than an in-process map because Workers spread requests across
 * short-lived isolates: an isolate-local counter resets unpredictably and each
 * isolate keeps its own, which looks like rate limiting without being it.
 *
 * A window is advanced by a single INSERT .. ON CONFLICT DO UPDATE .. RETURNING,
 * so read-modify-write happens inside one statement and concurrent requests
 * cannot both observe the same count.
 */
export const rateLimits = sqliteTable(
  'rate_limits',
  {
    /** Identifies the caller and the thing being limited, e.g. "signin:1.2.3.4". */
    key: text('key').primaryKey(),
    /** Requests seen in the current window, including the one being decided. */
    count: integer('count').notNull().default(0),
    /** Unix seconds at which the current window ends. */
    expiresAt: integer('expires_at').notNull(),
  },
  (table) => [index('rate_limits_expires_idx').on(table.expiresAt)],
);
