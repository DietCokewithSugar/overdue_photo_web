import type { JsonObject, JsonValue } from '@/types/json';

type JsonBody = JsonValue | JsonObject | Record<string, unknown>;

type RequestInitWithJson<T extends JsonBody = JsonBody> = RequestInit & {
  json?: T;
};

const BASE_URL = '';

interface ApiError {
  status: number;
  message: string;
}

export class ApiClientError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const buildHeaders = (init?: RequestInitWithJson) => {
  const headers = new Headers(init?.headers);

  if (init?.json) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

export async function apiFetch<T, TBody extends JsonBody = JsonBody>(
  path: string,
  init?: RequestInitWithJson<TBody>
): Promise<T> {
  const headers = buildHeaders(init);
  const body = init?.json ? JSON.stringify(init.json) : init?.body;
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    body,
    headers,
    credentials: 'include',
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error: ApiError = payload?.error ?? {
      status: response.status,
      message: response.statusText
    };
    throw new ApiClientError(error.status, error.message);
  }

  return payload?.data as T;
}
