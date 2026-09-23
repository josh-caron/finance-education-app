import { ApiError } from './api-error';
import { sessionHeaders } from './auth-client';
import { API_URL } from './config';

export { ApiError } from './api-error';

/**
 * Thin fetch wrapper around the Hono API. `sessionHeaders()` is platform-split:
 * on native it replays the token from SecureStore, on web it is empty because
 * the browser sends the session cookie itself.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = await sessionHeaders();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...auth,
        ...init.headers,
      },
    });
  } catch {
    // fetch only rejects when the request never got an answer.
    throw new ApiError(0, 'Could not reach the server');
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      retryAfter?: number;
    } | null;
    const headerRetry = Number(response.headers.get('Retry-After'));
    const retryAfter = body?.retryAfter ?? (headerRetry > 0 ? headerRetry : undefined);
    throw new ApiError(
      response.status,
      body?.error ?? `Request failed (${response.status})`,
      retryAfter,
    );
  }

  return (await response.json()) as T;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
