import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Route tests only. src/__tests__ holds node:test suites, run separately.
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Hono's request logger prints a line per request; it drowns real failures.
    onConsoleLog: (log) => !/^\s*(<--|-->)\s/.test(log),
  },
});
