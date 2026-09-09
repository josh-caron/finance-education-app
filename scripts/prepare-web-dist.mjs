#!/usr/bin/env node
/**
 * Post-processes the Expo web export for Workers static assets.
 *
 * Cloudflare's `not_found_handling: "404-page"` serves `/404.html`. Expo names
 * its catch-all route `+not-found.html`, so without this copy nothing matches,
 * the request falls through to the Worker, and a mistyped URL answers with the
 * API's JSON 404 instead of the app.
 *
 * Copying rather than renaming keeps `/+not-found` reachable, which is where
 * Expo Router navigates for an unmatched route inside an already-loaded app.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'apps/mobile/dist');

const source = join(dist, '+not-found.html');
const target = join(dist, '404.html');

if (!existsSync(source)) {
  console.error(
    `\nprepare-web-dist failed: ${source} is missing.\n` +
      'Expo should emit it for the catch-all route. If the route was renamed,\n' +
      'update this script, or a mistyped URL will return the API JSON 404.\n',
  );
  process.exit(1);
}

copyFileSync(source, target);
console.log('Copied +not-found.html to 404.html for Workers not_found_handling.');
