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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const isBodyDefined = typeof options.body !== 'undefined';

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (isBodyDefined && !isFormData && !('Content-Type' in headers)) {
    headers['Content-Type'] = 'application/json';
  }

  const body = !isBodyDefined
    ? undefined
    : isFormData
      ? (options.body as FormData)
      : JSON.stringify(options.body);

  const url = `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body,
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : String(e);
    throw new Error(
      `Network error while calling ${url}. ` +
        `Check NEXT_PUBLIC_API_URL, backend availability, CORS, and http/https mixed-content. ` +
        `Original error: ${message}`
    );
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  postForm: <T>(path: string, formData: FormData, headers?: Record<string, string>) =>
    request<T>(path, { method: 'POST', body: formData, headers }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
