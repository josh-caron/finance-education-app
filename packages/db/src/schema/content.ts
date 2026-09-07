import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import type { Exercise, ExerciseKind } from '@fin/core';

/**
 * Course content: units form the skill tree, each holds ordered lessons, each
 * lesson holds ordered exercises. Rows are seeded from @fin/content, so the ids
 * here are the content slugs rather than generated keys.
 */

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  /** Position in the skill tree; lower sorts first. */
  sortOrder: integer('sort_order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Edges of the skill tree: a unit unlocks once every prerequisite is complete. */
export const unitPrerequisites = sqliteTable(
  'unit_prerequisites',
  {
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    prerequisiteUnitId: text('prerequisite_unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.unitId, table.prerequisiteUnitId] })],
);

export const lessons = sqliteTable(
  'lessons',
  {
    id: text('id').primaryKey(),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** Short teaching copy shown before the exercises. */
    intro: text('intro'),
    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [
    index('lessons_unit_idx').on(table.unitId),
    uniqueIndex('lessons_unit_order_idx').on(table.unitId, table.sortOrder),
  ],
);

export const exercises = sqliteTable(
  'exercises',
  {
    id: text('id').primaryKey(),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<ExerciseKind>().notNull(),
    prompt: text('prompt').notNull(),
    explanation: text('explanation'),
    sortOrder: integer('sort_order').notNull(),
    /**
     * The full exercise, including its answer key. Kept as JSON because each
     * kind carries a different shape; @fin/core's exerciseSchema is the
     * contract, validated on seed and on read.
     */
    payload: text('payload', { mode: 'json' }).$type<Exercise>().notNull(),
  },
  (table) => [
    index('exercises_lesson_idx').on(table.lessonId),
    uniqueIndex('exercises_lesson_order_idx').on(table.lessonId, table.sortOrder),
  ],
);
