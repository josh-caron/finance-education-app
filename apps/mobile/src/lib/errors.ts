import { ApiError } from './api-error';

const OFFLINE = 'Cannot reach the server. Check your connection and try again.';

/**
 * Turns a failure into something a learner can act on.
 *
 * Every failed request used to read "could not submit, try again", which is
 * wrong for most of them: a locked lesson, an expired session and a rate limit
 * each need a different response from the person reading it.
 */
export function describeError(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
): string {
  if (error instanceof ApiError) {
    return describeStatus(error.status, error.retryAfter, fallback, error.message);
  }

  // fetch rejects with a TypeError when it cannot reach the server at all.
  if (error instanceof TypeError) return OFFLINE;

  // Better Auth returns its failures as a value rather than throwing.
  const authError = asAuthError(error);
  if (authError) {
    return authError.message ?? describeStatus(authError.status ?? 0, undefined, fallback);
  }

  return fallback;
}

function describeStatus(
  status: number,
  retryAfter: number | undefined,
  fallback: string,
  serverMessage?: string,
): string {
  switch (status) {
    case 0:
      return OFFLINE;
    case 401:
      return 'Your session has ended. Sign in again to continue.';
    case 403:
      return serverMessage && serverMessage !== 'Forbidden'
        ? `${serverMessage}. Finish the earlier units first.`
        : 'This is locked until you finish the earlier units.';
    case 404:
      return 'That is no longer available. Go back and try again.';
    case 409:
      return 'Answer every exercise correctly before finishing the lesson.';
    case 413:
      return 'That answer is too long.';
    case 429:
      return `Too many attempts. Try again ${formatRetry(retryAfter)}.`;
    default:
      break;
  }

  if (status >= 500) return 'The server had a problem. Try again in a moment.';
  // Other 4xx are specific enough on the server to be worth showing as they are.
  if (status >= 400 && serverMessage) return serverMessage;
  return fallback;
}

/** "in 45 seconds", "in 2 minutes", and so on. */
export function formatRetry(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return 'in a moment';
  if (seconds < 60) return `in ${Math.ceil(seconds)} seconds`;

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`;

  const hours = Math.ceil(minutes / 60);
  return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
}

interface AuthError {
  message?: string;
  status?: number;
}

function asAuthError(error: unknown): AuthError | null {
  if (typeof error !== 'object' || error === null) return null;
  // Better Auth hands back a plain object. A thrown Error also has a message,
  // but it is an internal one and not written for a learner to read.
  if (error instanceof Error) return null;

  const candidate = error as AuthError;
  const usable = typeof candidate.message === 'string' || typeof candidate.status === 'number';
  return usable ? candidate : null;
}
