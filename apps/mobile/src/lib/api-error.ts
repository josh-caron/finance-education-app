/**
 * A failed API call. Kept apart from api.ts, which reaches into
 * expo-secure-store, so the error handling can be imported and tested anywhere.
 */
export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the server could not be reached at all. */
    readonly status: number,
    message: string,
    /** Seconds to wait, from a rate-limited response. */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
