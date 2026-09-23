import { describe, expect, it } from 'vitest';

import { ApiError } from '../api-error';
import { describeError } from '../errors';

/**
 * Checks the wording a learner actually sees, using real responses from a local
 * API rather than hand-made errors. Skipped when nothing is serving, so it does
 * not fail CI, which has no Worker running.
 *
 *   pnpm dev:api    # then
 *   pnpm --filter @fin/mobile test
 */
const API = 'http://localhost:8787';

// Checked at load: skipIf is decided when tests are collected, before any hook runs.
const serverUp = await fetch(`${API}/health`)
  .then((response) => response.ok)
  .catch(() => false);

/** The same translation api.ts performs on a failed response. */
async function callApi(path: string, init: RequestInit = {}): Promise<never | void> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Origin: API, ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      retryAfter?: number;
    } | null;
    const headerRetry = Number(response.headers.get('Retry-After'));
    throw new ApiError(
      response.status,
      body?.error ?? `Request failed (${response.status})`,
      body?.retryAfter ?? (headerRetry > 0 ? headerRetry : undefined),
    );
  }
}

async function messageFor(path: string, init?: RequestInit): Promise<string> {
  try {
    await callApi(path, init);
    throw new Error(`Expected ${path} to fail`);
  } catch (error) {
    return describeError(error, 'FALLBACK');
  }
}

async function signUp() {
  const email = `err-${crypto.randomUUID()}@example.com`;
  const response = await fetch(`${API}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: API },
    body: JSON.stringify({ name: 'Error Check', email, password: 'password123' }),
  });
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  return { email, cookie };
}

const today = () => new Date().toISOString().slice(0, 10);

describe.skipIf(!serverUp)('messages shown for real API failures', () => {
  it('an ended session asks the learner to sign in again', async () => {
    expect(await messageFor('/api/progress/me')).toBe(
      'Your session has ended. Sign in again to continue.',
    );
  });

  it('a locked lesson says what unlocks it', async () => {
    const { cookie } = await signUp();

    const message = await messageFor('/api/progress/lessons/banking-emergency.accounts/attempts', {
      method: 'POST',
      headers: { Cookie: cookie },
      body: JSON.stringify({
        localDay: today(),
        exerciseId: 'banking-emergency.accounts.purpose',
        answer: { kind: 'multiple_choice', choiceId: 'a' },
      }),
    });

    expect(message).toBe('This lesson is locked. Finish the earlier units first.');
  });

  it('an unfinished lesson explains what is missing', async () => {
    const { cookie } = await signUp();

    const message = await messageFor(
      '/api/progress/lessons/budgeting-saving.income-expenses/complete',
      {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify({ localDay: today() }),
      },
    );

    expect(message).toBe('Answer every exercise correctly before finishing the lesson.');
  });

  it('a rate limit says how long to wait', async () => {
    const { email } = await signUp();
    const ask = () =>
      messageFor('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email, redirectTo: '/reset-password' }),
      }).catch(() => '');

    let message = '';
    // The email rule allows 5 an hour; the next one is refused.
    for (let i = 0; i < 8 && !message.startsWith('Too many'); i += 1) message = await ask();

    expect(message).toMatch(/^Too many attempts\. Try again in .+\.$/);
  });

  it('an unreachable server blames the connection, not the learner', async () => {
    let message = '';
    try {
      await fetch('http://localhost:9/api/progress/me');
    } catch (thrown) {
      message = describeError(new ApiError(0, 'Could not reach the server'), 'FALLBACK');
      expect(thrown).toBeDefined();
    }
    expect(message).toBe('Cannot reach the server. Check your connection and try again.');
  });
});
