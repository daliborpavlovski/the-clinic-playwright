import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  data?: unknown;
  failOnStatusCode?: boolean;
}

/**
 * Base API client — wraps Playwright's APIRequestContext with:
 * - automatic token injection
 * - structured request logging
 * - assertStatus() helper
 */
export class BaseClient {
  protected token: string | null = null;

  constructor(protected readonly request: APIRequestContext) {}

  setToken(token: string): this {
    this.token = token;
    return this;
  }

  protected buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...extra,
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  protected log(method: string, url: string, status: number, durationMs: number) {
    const icon = status < 300 ? '✓' : status < 400 ? '→' : '✗';
    console.log(`  ${icon} [API] ${method} ${url} → ${status} (${durationMs}ms)`);
  }

  async request_<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: RequestOptions = {},
  ): Promise<{ response: APIResponse; body: T }> {
    const start = Date.now();
    const fetchOptions: Parameters<APIRequestContext['fetch']>[1] = {
      method,
      headers: this.buildHeaders(options.headers ?? {}),
      failOnStatusCode: options.failOnStatusCode ?? false,
    };

    if (options.data !== undefined) {
      fetchOptions.data = JSON.stringify(options.data);
    }
    if (options.params) {
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(options.params).map(([k, v]) => [k, String(v)]))
      ).toString();
      path = `${path}?${q}`;
    }

    const response = await this.request.fetch(path, fetchOptions);
    const duration = Date.now() - start;
    this.log(method, path, response.status(), duration);

    let body: T;
    const contentType = response.headers()['content-type'] ?? '';
    if (contentType.includes('application/json') && response.status() !== 204) {
      body = (await response.json()) as T;
    } else {
      body = null as unknown as T;
    }

    return { response, body };
  }

  assertStatus(response: APIResponse, expectedStatus: number) {
    expect(
      response.status(),
      `Expected HTTP ${expectedStatus}, got ${response.status()} for ${response.url()}`,
    ).toBe(expectedStatus);
  }

  async get<T = unknown>(path: string, options?: RequestOptions) {
    return this.request_<T>('GET', path, options);
  }

  async post<T = unknown>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request_<T>('POST', path, { ...options, data });
  }

  async put<T = unknown>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request_<T>('PUT', path, { ...options, data });
  }

  async patch<T = unknown>(path: string, data?: unknown, options?: RequestOptions) {
    return this.request_<T>('PATCH', path, { ...options, data });
  }

  async delete<T = unknown>(path: string, options?: RequestOptions) {
    return this.request_<T>('DELETE', path, options);
  }
}
