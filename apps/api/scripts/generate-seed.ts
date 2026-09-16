import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { units } from '@fin/content';

import { renderSeedSql } from '../src/seed-sql';

/**
 * Writes the authored course in @fin/content to a SQL file that wrangler
 * applies to D1. Re-run it whenever content changes; it updates content in
 * place and leaves learner progress alone. See src/seed-sql.ts for the details.
 *
 *   pnpm --filter @fin/api db:seed:local
 */

const outputPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.seed/content.sql');

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderSeedSql(units, Math.floor(Date.now() / 1000)), 'utf8');

const lessonCount = units.reduce((total, unit) => total + unit.lessons.length, 0);
const exerciseCount = units.reduce(
  (total, unit) => total + unit.lessons.reduce((sum, lesson) => sum + lesson.exercises.length, 0),
  0,
);

console.log(
  `Wrote ${outputPath}\n  ${units.length} units, ${lessonCount} lessons, ${exerciseCount} exercises`,
);
