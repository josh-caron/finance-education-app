#!/usr/bin/env node
/**
 * Refuses to let a web bundle carrying a local address reach production.
 *
 * The deployed client is served by the same Worker as the API, so its API base
 * must be empty and every request relative. Two things can break that, and both
 * fail at runtime in a visitor's browser rather than at build time:
 *
 *   - A warm Metro cache can serve a bundle that resolved config.ts, whose
 *     native fallback is http://localhost:8787, instead of config.web.ts. This
 *     is why the release build passes --clear, and it is the failure this guard
 *     was written for after it actually happened.
 *   - EXPO_PUBLIC_ variables are inlined at build time, so a stray .env or
 *     .env.production could bake in a developer's own URL. (`expo export` does
 *     not read .env.local, so that file alone is harmless.)
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const bundleDir = join(root, 'apps/mobile/dist/_expo/static/js/web');

/** Addresses that only ever resolve on a developer's own machine or LAN. */
const forbidden = [
  /localhost:\d+/,
  /127\.0\.0\.1:\d+/,
  /192\.168\.\d+\.\d+:\d+/,
  /10\.\d+\.\d+\.\d+:\d+/,
  /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+/,
];

let files;
try {
  files = readdirSync(bundleDir).filter((name) => name.endsWith('.js'));
} catch {
  fail(`No web bundle at ${bundleDir}. Run pnpm build:web:release first.`);
}

if (files.length === 0) fail(`No JavaScript in ${bundleDir}.`);

const problems = [];

for (const name of files) {
  const contents = readFileSync(join(bundleDir, name), 'utf8');

  for (const pattern of forbidden) {
    const match = contents.match(pattern);
    if (match) problems.push(`${name}: contains ${match[0]}`);
  }
}

if (problems.length > 0) {
  fail(
    `The web bundle points at a local address:\n` +
      problems.map((p) => `  ${p}`).join('\n') +
      `\n\nThis ships an app that calls your own machine. Rebuild with:\n` +
      `  pnpm build:web:release\n` +
      `which ignores .env.local and clears the Metro cache.`,
  );
}

console.log(`Web bundle looks deployable (${files.length} file(s), no local addresses).`);

function fail(message) {
  console.error(`\nBundle check failed: ${message}\n`);
  process.exit(1);
}
