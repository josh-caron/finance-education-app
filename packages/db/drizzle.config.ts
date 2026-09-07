import { defineConfig } from 'drizzle-kit';

/**
 * Generates plain SQL migrations into ./drizzle. Wrangler applies them to D1
 * (see the db:migrate scripts in apps/api), so no database credentials are
 * needed here.
 */
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
});
