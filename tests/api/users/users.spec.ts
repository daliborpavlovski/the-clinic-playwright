import { test, expect } from '../../../src/fixtures/index';
import { assertPaginationShape } from '../../../src/api/helpers/response.helper';

test.describe('API — Users', () => {
  test('@smoke GET /users/me returns current user', async ({ patientApi }) => {
    const { response, body } = await patientApi.users.getMe();
    expect(response.status()).toBe(200);
    expect(body.email).toBe(process.env.PATIENT_EMAIL);
    expect(body.role).toBe('patient');
  });

  test('GET /users requires admin → patient gets 403', async ({ patientApi }) => {
    const { response } = await patientApi.users.list();
    expect(response.status()).toBe(403);
  });

  test('GET /users as admin returns paginated list', async ({ adminApi }) => {
    const { response, body } = await adminApi.users.list(1, 10);
    expect(response.status()).toBe(200);
    assertPaginationShape(body as unknown as Record<string, unknown>);
    expect(body.items.length).toBeGreaterThanOrEqual(3); // at least seed users
  });

  test('unauthenticated request returns 403 or 401', async ({ anonApi }) => {
    const { response } = await anonApi.users.getMe();
    expect([401, 403, 422]).toContain(response.status());
  });
});
