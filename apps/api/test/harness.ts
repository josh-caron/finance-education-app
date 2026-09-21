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
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'Finance Education App <test@example.com>',
  };

  // Email goes to Resend over fetch. Only that URL is intercepted; everything
  // else, including the D1 proxy, passes straight through.
  const sentEmails: SentEmail[] = [];
  let resendStatus = 200;
  let resendGate: Promise<void> | null = null;
  let deliveredEmails = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (!url.startsWith('https://api.resend.com/')) return realFetch(input, init);

    const payload = JSON.parse(String(init?.body)) as ResendPayload;
    sentEmails.push({
      to: payload.to[0]!,
      from: payload.from,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      authorization: new Headers(init?.headers).get('Authorization'),
    });
    if (resendGate) await resendGate;
    deliveredEmails += 1;
    return new Response(JSON.stringify({ id: `email-${sentEmails.length}` }), {
      status: resendStatus,
    });
  }) as typeof fetch;

  // A stand-in execution context that records background tasks, so tests can
  // wait for emails that the Worker sends after responding.
  const pending: Promise<unknown>[] = [];
  const ctx = {
    waitUntil: (task: Promise<unknown>) => void pending.push(task),
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext;

  async function settle() {
    while (pending.length > 0) await Promise.allSettled(pending.splice(0));
  }

  let userCount = 0;

  async function request(
    path: string,
    {
      method = 'GET',
      body,
      cookie,
      origin = BASE,
      env: overrides,
      settle: wait = true,
    }: RequestOptions = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { Origin: origin };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookie) headers.Cookie = cookie;

    const response = await worker.fetch(
      new Request(`${BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      { ...env, ...overrides },
      ctx,
    );

    if (wait) await settle();
    return response;
  }

  /** Signs up a fresh learner and returns the session cookie for later requests. */
  async function signUp(name = 'Learner'): Promise<string> {
    return (await signUpAs(name)).cookie;
  }

  /** Like signUp, but also returns the address and password, for auth tests. */
  async function signUpAs(name = 'Learner', password = 'password123') {
    userCount += 1;
    const email = `learner-${userCount}-${crypto.randomUUID()}@example.com`;

    const response = await request('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name, email, password },
    });

    if (response.status !== 200) {
      throw new Error(`Sign-up failed with ${response.status}: ${await response.text()}`);
    }

    return { cookie: sessionCookie(response), email, password };
  }

  async function signIn(email: string, password: string) {
    const response = await request('/api/auth/sign-in/email', {
      method: 'POST',
      body: { email, password },
    });
    return { status: response.status, cookie: response.ok ? sessionCookie(response) : '' };
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
    signUpAs,
    signIn,
    settle,
    /** Emails the Worker handed to Resend, oldest first. */
    emails: () => [...sentEmails],
    emailsTo: (address: string) => sentEmails.filter((email) => email.to === address),
    /** How many Resend calls have finished, as opposed to started. */
    deliveredCount: () => deliveredEmails,
    /** Holds every Resend call open until the returned function is called. */
    holdResend: () => {
      let release!: () => void;
      resendGate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => {
        resendGate = null;
        release();
      };
    },
    /** Makes the stubbed Resend API answer with this status from now on. */
    setResendStatus: (status: number) => {
      resendStatus = status;
    },
    /** Rate limits persist in D1, so each test starts with a clean slate. */
    resetRateLimits: () => db.prepare('DELETE FROM rate_limits').run(),
    dispose: async () => {
      globalThis.fetch = realFetch;
      await proxy.dispose();
    },
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
  /** Origin header to send. Defaults to the test base URL. */
  origin?: string;
  env?: Partial<Bindings>;
  /** Wait for background tasks such as emails before returning. Defaults to true. */
  settle?: boolean;
}

export interface SentEmail {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  authorization: string | null;
}

interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
}

/** The first link in an email, as a path and query this harness can request. */
export function linkIn(email: SentEmail): string {
  const match = email.text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`No link in email: ${email.subject}`);
  const url = new URL(match[0]);
  return `${url.pathname}${url.search}`;
}

function sessionCookie(response: Response): string {
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  if (!cookie) throw new Error('Response set no session cookie');
  return cookie;
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
  celebration?: {
    unitJustCompleted: boolean;
    leveledUp: boolean;
    newAchievements: { id: string }[];
  };
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
