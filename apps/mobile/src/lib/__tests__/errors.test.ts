import { describe, expect, it } from 'vitest';

import { ApiError } from '../api-error';
import { describeError, formatRetry } from '../errors';

describe('describeError', () => {
  it('explains a lost session rather than blaming the answer', () => {
    expect(describeError(new ApiError(401, 'Authentication required'))).toMatch(/sign in again/i);
  });

  it('explains a locked lesson and what unlocks it', () => {
    expect(describeError(new ApiError(403, 'This lesson is locked'))).toBe(
      'This lesson is locked. Finish the earlier units first.',
    );
  });

  it('says how long to wait when rate limited', () => {
    expect(describeError(new ApiError(429, 'Too many requests', 90))).toBe(
      'Too many attempts. Try again in 2 minutes.',
    );
  });

  it('tells the learner to finish the lesson properly on a conflict', () => {
    expect(
      describeError(new ApiError(409, 'Every exercise must be answered correctly first')),
    ).toMatch(/answer every exercise/i);
  });

  it('does not blame the learner for a server fault', () => {
    expect(describeError(new ApiError(500, 'Internal server error'))).toMatch(
      /server had a problem/i,
    );
  });

  it('recognises being offline', () => {
    expect(describeError(new ApiError(0, 'Could not reach the server'))).toMatch(/connection/i);
    expect(describeError(new TypeError('Failed to fetch'))).toMatch(/connection/i);
  });

  it("passes through a specific 400 from the server, since it names what's wrong", () => {
    expect(describeError(new ApiError(400, 'Keep your name to 40 characters or fewer.'))).toBe(
      'Keep your name to 40 characters or fewer.',
    );
  });

  it("uses Better Auth's message, which it returns rather than throws", () => {
    expect(describeError({ message: 'Invalid email or password', status: 401 })).toBe(
      'Invalid email or password',
    );
  });

  it('falls back to the caller’s wording when it has nothing better', () => {
    expect(describeError(new Error('boom'), 'Could not save your answer.')).toBe(
      'Could not save your answer.',
    );
    expect(describeError(undefined, 'Could not load the leaderboard.')).toBe(
      'Could not load the leaderboard.',
    );
  });
});

describe('formatRetry', () => {
  it('reads naturally at each scale', () => {
    expect(formatRetry(30)).toBe('in 30 seconds');
    expect(formatRetry(60)).toBe('in 1 minute');
    expect(formatRetry(150)).toBe('in 3 minutes');
    expect(formatRetry(3600)).toBe('in about 1 hour');
    expect(formatRetry(7200)).toBe('in about 2 hours');
  });

  it('handles missing or elapsed waits', () => {
    expect(formatRetry(undefined)).toBe('in a moment');
    expect(formatRetry(0)).toBe('in a moment');
  });
});
