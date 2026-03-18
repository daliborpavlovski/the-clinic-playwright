import { expect, APIResponse } from '@playwright/test';

/**
 * Assert a response body matches an expected JSON schema shape.
 * Pass an object of key → expected type string.
 */
export function assertResponseSchema(body: Record<string, unknown>, schema: Record<string, string>) {
  for (const [key, expectedType] of Object.entries(schema)) {
    expect(
      typeof body[key],
      `Schema mismatch: field "${key}" should be ${expectedType}, got ${typeof body[key]}`
    ).toBe(expectedType);
  }
}

/**
 * Extract pagination metadata from a paginated response body.
 */
export function extractPagination(body: {
  total: number;
  page: number;
  size: number;
  pages: number;
}) {
  return {
    total: body.total,
    page: body.page,
    size: body.size,
    pages: body.pages,
  };
}

/**
 * Assert all required pagination fields are present and valid.
 */
export function assertPaginationShape(body: Record<string, unknown>) {
  expect(typeof body['total']).toBe('number');
  expect(typeof body['page']).toBe('number');
  expect(typeof body['size']).toBe('number');
  expect(typeof body['pages']).toBe('number');
  expect(Array.isArray(body['items'])).toBe(true);
}
