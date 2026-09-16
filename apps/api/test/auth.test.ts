import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHarness, linkIn, restoreClock, setToday, type Harness } from './harness';

const DAY = '2026-09-14';
const BASE = 'http://localhost:8787';

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => {
  // Undefined if setup itself failed; let that error be the one reported.
  await h?.dispose();
});

beforeEach(async () => {
  setToday(DAY);
  await h.resetRateLimits();
  h.setResendStatus(200);
});

afterEach(() => {
  restoreClock();
  vi.restoreAllMocks();
});

async function emailVerified(email: string) {
  const row = await h.db
    .prepare('SELECT email_verified AS v FROM user WHERE email = ?')
    .bind(email)
    .first<{ v: number }>();
  return row?.v === 1;
}

/** Signs up and verifies through the emailed link, like a real learner. */
async function verifiedLearner(name = 'Verified') {
  const learner = await h.signUpAs(name);
  const [email] = h.emailsTo(learner.email);
  await h.request(linkIn(email!));
  return learner;
}

async function requestReset(email: string) {
  return h.request('/api/auth/request-password-reset', {
    method: 'POST',
    body: { email, redirectTo: '/reset-password' },
  });
}

/** Follows the reset email to the token the frontend would receive. */
async function resetToken(email: string) {
  const [message] = h.emailsTo(email).filter((m) => m.subject.includes('Reset'));
  const redirect = await h.request(linkIn(message!));
  expect(redirect.status).toBe(302);
  const location = new URL(redirect.headers.get('Location')!, BASE);
  expect(location.pathname).toBe('/reset-password');
  return location.searchParams.get('token')!;
}

describe('email verification', () => {
  it('lets a learner in immediately and sends a verification email on sign-up', async () => {
    const learner = await h.signUpAs('Ada');

    const inbox = h.emailsTo(learner.email);
    expect(inbox).toHaveLength(1);
    expect(inbox[0]).toMatchObject({
      from: 'Finance Education App <test@example.com>',
      authorization: 'Bearer re_test_key',
    });
    expect(inbox[0]!.subject).toMatch(/verify/i);
    expect(linkIn(inbox[0]!)).toMatch(/^\/api\/auth\/verify-email\?token=/);

    // Not verified yet, but already signed in.
    expect(await emailVerified(learner.email)).toBe(false);
    expect((await h.request('/api/progress/me', { cookie: learner.cookie })).status).toBe(200);
  });

  it('marks the address verified when the link is followed', async () => {
    const learner = await h.signUpAs();

    const response = await h.request(linkIn(h.emailsTo(learner.email)[0]!));

    expect(response.status).toBe(302);
    expect(await emailVerified(learner.email)).toBe(true);
  });

  it('rejects a tampered verification token', async () => {
    const learner = await h.signUpAs();

    await h.request('/api/auth/verify-email?token=not-a-real-token');

    expect(await emailVerified(learner.email)).toBe(false);
  });

  it('can resend the verification email', async () => {
    const learner = await h.signUpAs();

    const response = await h.request('/api/auth/send-verification-email', {
      method: 'POST',
      body: { email: learner.email },
    });

    expect(response.status).toBe(200);
    expect(h.emailsTo(learner.email)).toHaveLength(2);
  });
});

describe('password reset', () => {
  it('resets a verified learner password end to end', async () => {
    const learner = await verifiedLearner();

    const requested = await requestReset(learner.email);
    expect(requested.status).toBe(200);

    const token = await resetToken(learner.email);
    const reset = await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'a-brand-new-password' },
    });

    expect(reset.status).toBe(200);
    expect((await h.signIn(learner.email, 'a-brand-new-password')).status).toBe(200);
    expect((await h.signIn(learner.email, learner.password)).status).not.toBe(200);
  });

  it('signs out every existing session when the password is reset', async () => {
    const learner = await verifiedLearner();
    expect((await h.request('/api/progress/me', { cookie: learner.cookie })).status).toBe(200);

    await requestReset(learner.email);
    const token = await resetToken(learner.email);
    await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'a-brand-new-password' },
    });

    expect((await h.request('/api/progress/me', { cookie: learner.cookie })).status).toBe(401);
  });

  it('does not let a reset token be used twice', async () => {
    const learner = await verifiedLearner();
    await requestReset(learner.email);
    const token = await resetToken(learner.email);

    const first = await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'first-new-password' },
    });
    const second = await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'second-new-password' },
    });

    expect(first.status).toBe(200);
    expect(second.status).not.toBe(200);
    expect((await h.signIn(learner.email, 'first-new-password')).status).toBe(200);
  });

  it('expires reset tokens after an hour', async () => {
    const learner = await verifiedLearner();
    await requestReset(learner.email);
    const token = await resetToken(learner.email);

    vi.setSystemTime(new Date(`${DAY}T13:01:00Z`));
    const response = await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'too-late-password' },
    });

    expect(response.status).not.toBe(200);
    expect((await h.signIn(learner.email, learner.password)).status).toBe(200);
  });

  it('sends nothing to an unverified address, and answers the same way', async () => {
    const learner = await h.signUpAs();
    const before = h.emailsTo(learner.email).length;

    const response = await requestReset(learner.email);

    expect(response.status).toBe(200);
    expect(h.emailsTo(learner.email)).toHaveLength(before);
  });

  it('answers the same way for an address with no account', async () => {
    const before = h.emails().length;

    const response = await requestReset('nobody@example.com');

    expect(response.status).toBe(200);
    expect(h.emails()).toHaveLength(before);
  });

  it('rejects a new password that is too short', async () => {
    const learner = await verifiedLearner();
    await requestReset(learner.email);
    const token = await resetToken(learner.email);

    const response = await h.request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: 'short' },
    });

    expect(response.status).toBe(400);
  });
});

describe('email delivery', () => {
  it('escapes the learner name in the HTML email', async () => {
    const learner = await h.signUpAs('<img src=x onerror=alert(1)>');

    const [email] = h.emailsTo(learner.email);

    expect(email!.html).not.toContain('<img');
    expect(email!.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('does not fail sign-up when the email provider does', async () => {
    h.setResendStatus(500);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    const learner = await h.signUpAs();

    expect((await h.request('/api/progress/me', { cookie: learner.cookie })).status).toBe(200);
    expect(errors).toHaveBeenCalledWith(
      'Resend rejected an email',
      expect.objectContaining({ status: 500 }),
    );
  });

  it('responds without waiting for the email provider', async () => {
    const delivered = h.deliveredCount();
    const release = h.holdResend();

    try {
      const response = await h.request('/api/auth/sign-up/email', {
        method: 'POST',
        body: {
          name: 'Quick',
          email: `quick-${crypto.randomUUID()}@example.com`,
          password: 'password123',
        },
        settle: false,
      });

      // Sign-up has answered while Resend is still holding the email.
      expect(response.status).toBe(200);
      expect(h.deliveredCount()).toBe(delivered);
    } finally {
      release();
    }

    await h.settle();
    expect(h.deliveredCount()).toBe(delivered + 1);
  });

  it('logs no link when email is unconfigured on a deployed origin', async () => {
    const deployed = 'https://fin.example.com';
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infos = vi.spyOn(console, 'info').mockImplementation(() => {});
    const before = h.emails().length;

    const response = await h.request('/api/auth/sign-up/email', {
      method: 'POST',
      origin: deployed,
      body: {
        name: 'NoMail',
        email: `nomail-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
      env: { RESEND_API_KEY: undefined, BETTER_AUTH_URL: deployed },
    });

    expect(response.status).toBe(200);
    expect(h.emails()).toHaveLength(before);
    expect(errors).toHaveBeenCalledWith(
      'Email not sent: RESEND_API_KEY or EMAIL_FROM is not configured',
      expect.anything(),
    );
    const logged = JSON.stringify([...errors.mock.calls, ...infos.mock.calls]);
    expect(logged).not.toMatch(/token=/);
  });

  it('prints the full email locally when unconfigured, so reset can be tested', async () => {
    const infos = vi.spyOn(console, 'info').mockImplementation(() => {});

    await h.request('/api/auth/sign-up/email', {
      method: 'POST',
      body: {
        name: 'Local',
        email: `local-${crypto.randomUUID()}@example.com`,
        password: 'password123',
      },
      env: { RESEND_API_KEY: undefined },
    });

    expect(JSON.stringify(infos.mock.calls)).toMatch(/verify-email\?token=/);
  });

  it('limits requests that send email', async () => {
    const learner = await verifiedLearner();
    await h.resetRateLimits();

    const statuses = [];
    for (let i = 0; i < 6; i += 1) statuses.push((await requestReset(learner.email)).status);

    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});

describe('account deletion', () => {
  async function fullLearner() {
    const learner = await h.signUpAs();
    await h.request('/api/progress/lessons/basics.one/attempts', {
      method: 'POST',
      cookie: learner.cookie,
      body: {
        exerciseId: 'basics.one.choice',
        answer: { kind: 'multiple_choice', choiceId: 'b' },
        localDay: DAY,
      },
    });
    const { id } = (await h.db
      .prepare('SELECT id FROM user WHERE email = ?')
      .bind(learner.email)
      .first<{ id: string }>())!;
    return { ...learner, id };
  }

  async function rowsFor(userId: string) {
    const count = async (table: string) =>
      (await h.db
        .prepare(`SELECT count(*) AS n FROM ${table} WHERE user_id = ?`)
        .bind(userId)
        .first<{ n: number }>())!.n;
    return {
      user: (await h.db
        .prepare('SELECT count(*) AS n FROM user WHERE id = ?')
        .bind(userId)
        .first<{ n: number }>())!.n,
      session: await count('session'),
      account: await count('account'),
      learner_profiles: await count('learner_profiles'),
      exercise_attempts: await count('exercise_attempts'),
      lesson_progress: await count('lesson_progress'),
      daily_activity: await count('daily_activity'),
    };
  }

  it('deletes the account and every learner row with the correct password', async () => {
    const learner = await fullLearner();
    const before = await rowsFor(learner.id);
    expect(before.exercise_attempts).toBeGreaterThan(0);
    expect(before.daily_activity).toBeGreaterThan(0);

    const response = await h.request('/api/auth/delete-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: { password: learner.password },
    });

    expect(response.status).toBe(200);
    expect(await rowsFor(learner.id)).toEqual({
      user: 0,
      session: 0,
      account: 0,
      learner_profiles: 0,
      exercise_attempts: 0,
      lesson_progress: 0,
      daily_activity: 0,
    });
    expect((await h.request('/api/progress/me', { cookie: learner.cookie })).status).toBe(401);
  });

  it('refuses without a password, even with a brand-new session', async () => {
    const learner = await fullLearner();

    const response = await h.request('/api/auth/delete-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: {},
    });

    expect(response.status).toBe(400);
    expect((await rowsFor(learner.id)).user).toBe(1);
  });

  it('refuses with the wrong password', async () => {
    const learner = await fullLearner();

    const response = await h.request('/api/auth/delete-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: { password: 'not-my-password' },
    });

    expect(response.status).not.toBe(200);
    expect((await rowsFor(learner.id)).user).toBe(1);
  });

  it('refuses when signed out', async () => {
    const response = await h.request('/api/auth/delete-user', {
      method: 'POST',
      body: { password: 'password123' },
    });

    expect(response.status).toBe(401);
  });

  it('frees the address to sign up again', async () => {
    const learner = await fullLearner();
    await h.request('/api/auth/delete-user', {
      method: 'POST',
      cookie: learner.cookie,
      body: { password: learner.password },
    });

    const again = await h.request('/api/auth/sign-up/email', {
      method: 'POST',
      body: { name: 'Back again', email: learner.email, password: 'password123' },
    });

    expect(again.status).toBe(200);
  });
});
