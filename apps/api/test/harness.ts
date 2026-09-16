import { vi } from 'vitest';
import { getPlatformProxy } from 'wrangler';

import worker from '../src/index';
import { renderSeedSql } from '../src/seed-sql';
import type { Bindings } from '../src/types';
import { correctAnswers, fixtureCourse, type FixtureLessonId } from './fixtures';

const BASE = 'http://localhost:8787';

const migrations = import.meta.glob<string>('../../../packages/db/drizzle/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/**
 * Runs the real Worker against a real, in-memory D1 from Wrangler.
 *
 * Nothing about the database is mocked: the actual migrations create it, the
 * actual seed renderer loads the fixture course, and requests go through the
 * Worker's own fetch handler, so middleware order, rate limiting, Better Auth
 * and Drizzle all run as they do when deployed.
 */
export async function createHarness() {
  const proxy = await getPlatformProxy<{ DB: D1Database }>({
    // decodeURIComponent because pathname percent-encodes spaces, and this repo
    // lives at a path with spaces in it on at least one of our machines.
    configPath: decodeURIComponent(new URL('./wrangler.test.jsonc', import.meta.url).pathname),
    envFiles: [],
    persist: false,
    remoteBindings: false,
  });

  const db = proxy.env.DB;

  for (const name of Object.keys(migrations).sort()) {
    for (const statement of splitMigration(migrations[name]!)) {
      await db.prepare(statement).run();
    }
  }

  for (const statement of splitSeed(renderSeedSql(fixtureCourse, 1_000))) {
    await db.prepare(statement).run();
  }

  const env: Bindings = {
    DB: db,
    BETTER_AUTH_SECRET: 'test-secret-that-is-comfortably-over-32-characters',
    BETTER_AUTH_URL: BASE,
    TRUSTED_ORIGINS: 'fineduapp://',
  };

  let userCount = 0;

  async function request(
    path: string,
    { method = 'GET', body, cookie, env: overrides }: RequestOptions = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { Origin: BASE };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;

    return worker.fetch(
      new Request(`${BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { ...env, ...overrides },
      proxy.ctx,
    );
  }

  /** Signs up a fresh learner and returns the session cookie for later requests. */
  async function signUp(name = 'Learner'): Promise<string> {
    userCount += 1;
    const email = `learner-${userCount}-${crypto.randomUUID()}@example.com`;

    const response = await request('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name, email, password: 'password123' },
    });

    if (response.status !== 200) {
      throw new Error(`Sign-up failed with ${response.status}: ${await response.text()}`);
    }

    const cookie = response.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');

    if (!cookie) throw new Error('Sign-up returned no session cookie');
    return cookie;
  }

  function attempt(cookie: string, lessonId: string, submission: object, localDay: string) {
    return request(`/api/progress/lessons/${lessonId}/attempts`, {
      method: 'POST',
      cookie,
      body: { ...submission, localDay },
    });
  }

  function complete(cookie: string, lessonId: string, localDay: string) {
    return request(`/api/progress/lessons/${lessonId}/complete`, {
      method: 'POST',
      cookie,
      body: { localDay },
    });
  }

  /** Answers every exercise in a lesson correctly on the first try. */
  async function answerAll(cookie: string, lessonId: FixtureLessonId, localDay: string) {
    const results = [];
    for (const submission of correctAnswers[lessonId]) {
      const response = await attempt(cookie, lessonId, submission, localDay);
      results.push((await response.json()) as AttemptBody);
    }
    return results;
  }

  return {
    db,
    request,
    signUp,
    attempt,
    complete,
    answerAll,
    /** Rate limits persist in D1, so each test starts with a clean slate. */
    resetRateLimits: () => db.prepare('DELETE FROM rate_limits').run(),
    dispose: () => proxy.dispose(),
  };
}

export type Harness = Awaited<ReturnType<typeof createHarness>>;

/**
 * Pins the server's clock to midday UTC on `day`.
 *
 * The API only accepts a learner's local day within one day of the server's
 * UTC date, so tests that submit fixed dates have to move the clock with them.
 * Only Date is faked: timers stay real, so the D1 proxy connection is unaffected.
 */
export function setToday(day: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(`${day}T12:00:00Z`));
}

export function restoreClock() {
  vi.useRealTimers();
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  cookie?: string;
  env?: Partial<Bindings>;
}

export interface AttemptBody {
  correct: boolean;
  expected?: string;
  explanation?: string;
  attemptNumber: number;
  xpAwarded: number;
  practice: boolean;
  totalXp: number;
}

export interface CompletionBody {
  xpEarned: number;
  bonus: number;
  score: number;
  firstCompletion: boolean;
  practice: boolean;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
}

function splitMigration(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

/** The renderer writes one statement per line, with comment lines at the top. */
function splitSeed(sql: string): string[] {
  return sql
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'));
}
