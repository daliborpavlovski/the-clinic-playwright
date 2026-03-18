import { test as base, APIRequestContext } from '@playwright/test';
import { AuthClient } from '../api/client/auth.client';
import { AppointmentsClient } from '../api/client/appointments.client';
import { DoctorsClient } from '../api/client/doctors.client';
import { UsersClient } from '../api/client/users.client';

/**
 * Role-scoped API client bundles.
 * Each bundle contains pre-authenticated clients for each endpoint group.
 */
export interface ApiBundle {
  auth: AuthClient;
  appointments: AppointmentsClient;
  doctors: DoctorsClient;
  users: UsersClient;
}

export type ApiFixtures = {
  patientApi: ApiBundle;
  doctorApi: ApiBundle;
  adminApi: ApiBundle;
  anonApi: ApiBundle;
};

// Always ensure a trailing slash so relative paths (e.g. 'auth/login') resolve correctly.
const API_BASE_URL = (process.env.API_URL || 'http://localhost/api/v1').replace(/\/?$/, '/');

function makeBundle(request: APIRequestContext, token: string | null = null): ApiBundle {
  const makeClient = <T extends { setToken: (t: string) => T }>(Client: new (r: APIRequestContext) => T) => {
    const c = new Client(request);
    if (token) c.setToken(token);
    return c;
  };

  return {
    auth: makeClient(AuthClient),
    appointments: makeClient(AppointmentsClient),
    doctors: makeClient(DoctorsClient),
    users: makeClient(UsersClient),
  };
}

async function loginRole(request: APIRequestContext, email: string, password: string): Promise<string> {
  const authClient = new AuthClient(request);
  const tokens = await authClient.loginAndSetToken(email, password);
  return tokens.access_token;
}

export const apiFixtures = base.extend<ApiFixtures>({
  patientApi: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await loginRole(apiContext, process.env.PATIENT_EMAIL!, process.env.PATIENT_PASSWORD!);
    await use(makeBundle(apiContext, token));
    await apiContext.dispose();
  },

  doctorApi: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await loginRole(apiContext, process.env.DOCTOR_EMAIL!, process.env.DOCTOR_PASSWORD!);
    await use(makeBundle(apiContext, token));
    await apiContext.dispose();
  },

  adminApi: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const token = await loginRole(apiContext, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
    await use(makeBundle(apiContext, token));
    await apiContext.dispose();
  },

  anonApi: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    await use(makeBundle(apiContext, null));
    await apiContext.dispose();
  },
});
