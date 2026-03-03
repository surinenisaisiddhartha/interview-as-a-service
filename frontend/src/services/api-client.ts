/**
 * Central API Client
 * Wraps fetch with base URL, auth headers, and error handling.
 * Replace with axios or ky for advanced features.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
