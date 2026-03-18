import { test, expect } from '../../../src/fixtures/index';
import { randomEmail, randomName, randomPassword } from '../../../src/utils/random.utils';
import { assertResponseSchema } from '../../../src/api/helpers/response.helper';
import { decodeJwt, getTokenRole } from '../../../src/api/helpers/token.helper';

test.describe('API — Auth: Register', () => {
  test('@smoke register returns 201 and correct schema', async ({ anonApi }) => {
    const { response, body } = await anonApi.auth.register({
      email: randomEmail('register'),
      password: randomPassword(),
      full_name: randomName(),
    });

    expect(response.status()).toBe(201);
    assertResponseSchema(body as unknown as Record<string, unknown>, {
      id: 'number',
      email: 'string',
      full_name: 'string',
      role: 'string',
      is_active: 'boolean',
      created_at: 'string',
    });
    expect(body.role).toBe('patient');
    expect(body.is_active).toBe(true);
  });

  test('register with duplicate email returns 409', async ({ anonApi }) => {
    const email = randomEmail('dup');
    const payload = { email, password: randomPassword(), full_name: randomName() };

    const first = await anonApi.auth.register(payload);
    expect(first.response.status()).toBe(201);

    const second = await anonApi.auth.register(payload);
    expect(second.response.status()).toBe(409);
  });

  test('register with missing required field returns 422', async ({ anonApi }) => {
    // Send payload without email — FastAPI responds 422 Unprocessable Entity
    const { response } = await anonApi.auth.post('auth/register', {
      password: randomPassword(),
      full_name: randomName(),
      // email intentionally omitted
    });
    expect(response.status()).toBe(422);
  });

  test('register with weak password (< 8 chars) returns 422', async ({ anonApi }) => {
    const { response } = await anonApi.auth.register({
      email: randomEmail(),
      password: 'short1',
      full_name: randomName(),
    });
    expect(response.status()).toBe(422);
  });

  test('register with password missing digit returns 422', async ({ anonApi }) => {
    const { response } = await anonApi.auth.register({
      email: randomEmail(),
      password: 'NoDigitPassword',
      full_name: randomName(),
    });
    expect(response.status()).toBe(422);
  });
});

test.describe('API — Auth: Login', () => {
  test('@smoke login returns JWT with correct structure', async ({ anonApi }) => {
    const email = randomEmail('login');
    const password = randomPassword();
    await anonApi.auth.register({ email, password, full_name: randomName() });

    const { response, body } = await anonApi.auth.login(email, password);

    expect(response.status()).toBe(200);
    expect(body.access_token).toBeTruthy();
    expect(body.refresh_token).toBeTruthy();
    expect(body.token_type).toBe('bearer');

    // Decode and assert JWT payload
    const payload = decodeJwt(body.access_token);
    expect(payload['type']).toBe('access');
    expect(typeof payload['sub']).toBe('string');
    expect(typeof payload['exp']).toBe('number');
    expect(getTokenRole(body.access_token)).toBe('patient');
  });

  test('login with wrong password returns 401', async ({ anonApi }) => {
    const email = randomEmail('badpwd');
    await anonApi.auth.register({ email, password: randomPassword(), full_name: randomName() });

    const { response } = await anonApi.auth.login(email, 'WrongPassword999');
    expect(response.status()).toBe(401);
  });

  test('login with non-existent email returns 401', async ({ anonApi }) => {
    const { response } = await anonApi.auth.login('nobody@theclinicapp.invalid', 'SomePass1');
    expect(response.status()).toBe(401);
  });

  test('request with expired/invalid token returns 401', async ({ anonApi }) => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTkiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxfQ.invalid';
    anonApi.users.setToken(fakeToken);
    const { response } = await anonApi.users.getMe();
    expect(response.status()).toBe(401);
  });
});
