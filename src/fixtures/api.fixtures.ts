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
  patientApi: async ({ request }, use) => {
    const email = process.env.PATIENT_EMAIL!;
    const password = process.env.PATIENT_PASSWORD!;
    const token = await loginRole(request, email, password);
    await use(makeBundle(request, token));
  },

  doctorApi: async ({ request }, use) => {
    const email = process.env.DOCTOR_EMAIL!;
    const password = process.env.DOCTOR_PASSWORD!;
    const token = await loginRole(request, email, password);
    await use(makeBundle(request, token));
  },

  adminApi: async ({ request }, use) => {
    const email = process.env.ADMIN_EMAIL!;
    const password = process.env.ADMIN_PASSWORD!;
    const token = await loginRole(request, email, password);
    await use(makeBundle(request, token));
  },

  anonApi: async ({ request }, use) => {
    await use(makeBundle(request, null));
  },
});
