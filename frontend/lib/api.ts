/**
 * Authenticated API fetch helper.
 * Automatically injects the Clerk Bearer token or a dev fallback in development.
 */
export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = 'Bearer dev_demo_token';
  }

  return fetch(path, { ...fetchOptions, headers });
}

/**
 * Typed API fetch that parses JSON and throws on non-2xx responses.
 * Distinguishes between:
 *  - Network errors (backend not running) → clear actionable message
 *  - HTTP errors (4xx/5xx) → backend error message or status code
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  let res: Response;

  try {
    res = await apiFetch(path, options);
  } catch {
    throw new Error(
      'Cannot reach the backend. Check that it is running and that the frontend backend URL is configured.'
    );
  }

  if (!res.ok) {
    // Try to parse a JSON error body; fall back to HTTP status text
    let message: string;
    try {
      const body = await res.json();
      message = body?.error ?? body?.message ?? `Server error (${res.status})`;
    } catch {
      message = `Server returned ${res.status} ${res.statusText || '(no detail)'}`;
    }
    throw new Error(message);
  }

  const data = (await res.json()) as T;
  return data;
}


