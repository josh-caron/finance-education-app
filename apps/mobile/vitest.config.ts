import { defineConfig } from 'vitest/config';

/**
 * Only the plain TypeScript helpers under src/lib. Screens need a React Native
 * renderer, which this project does not set up; those are checked by hand.
 */
export default defineConfig({
  test: {
    include: ['src/lib/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
