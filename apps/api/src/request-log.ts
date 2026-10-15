import type { MiddlewareHandler } from 'hono';

const REDACTED = '[redacted]';

/** Query parameters whose value is a credential, such as `token` on a verification link. */
const SECRET_PARAM = /token/i;

/**
 * Removes credentials from a path before it is logged. Verification links carry
 * the token in the query string, and password-reset links carry it as a path
 * segment; either one, read from the logs, is enough to take over an account.
 */
export function redactPath(pathWithQuery: string): string {
  const queryStart = pathWithQuery.indexOf('?');
  const path = queryStart === -1 ? pathWithQuery : pathWithQuery.slice(0, queryStart);
  const query = queryStart === -1 ? '' : pathWithQuery.slice(queryStart + 1);

  const safePath = path.replace(/(\/reset-password\/)[^/]+/i, `$1${REDACTED}`);
  if (!query) return safePath;

  const safeQuery = query
    .split('&')
    .map((pair) => {
      const key = pair.split('=')[0] ?? '';
      return SECRET_PARAM.test(safeDecode(key)) ? `${key}=${REDACTED}` : pair;
    })
    .join('&');

  return `${safePath}?${safeQuery}`;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Hono's `logger()` prints the full URL, credentials included. Same line format,
 * with the path passed through `redactPath` first.
 */
export const requestLog: MiddlewareHandler = async (c, next) => {
  const url = new URL(c.req.url);
  const path = redactPath(url.pathname + url.search);
  const started = Date.now();

  console.log(`<-- ${c.req.method} ${path}`);
  await next();
  console.log(`--> ${c.req.method} ${path} ${c.res.status} ${Date.now() - started}ms`);
};
