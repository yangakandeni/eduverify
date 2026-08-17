const BASE_URL = process.env.EDUVERIFY_API_BASE_URL ?? "";
const API_KEY = process.env.EDUVERIFY_API_KEY ?? "";
const REQUEST_TIMEOUT_MS = 5000;

/** Thrown for any non-ok response, and for a timed-out/aborted request (status 0). Carries
 * the HTTP status so callers can distinguish "not found" from a real outage. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "x-api-key": API_KEY, ...init.headers },
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new ApiError(0, `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

/** GETs JSON from the API. A 404 maps to null (the "no such resource" case) — every other
 * failure (5xx, timeout, network error) propagates as a thrown ApiError, since there's no
 * local fallback left post-cutover for callers to degrade to. */
export async function getJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** POSTs a JSON body to the API. Unlike getJson, a 404 here is a real error (not "no such
 * resource") and propagates like every other non-ok status. */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
