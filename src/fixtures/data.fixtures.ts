import { test as base } from '@playwright/test';
import { AuthClient } from '../api/client/auth.client';
import { AppointmentsClient } from '../api/client/appointments.client';
import { UsersClient } from '../api/client/users.client';
import { randomEmail, randomName, randomPassword } from '../utils/random.utils';
import { futureSlotPair } from '../utils/date.utils';
import type { User, Appointment } from '../types/api.types';

export type DataFixtures = {
  createTestUser: (role?: 'patient' | 'doctor' | 'admin') => Promise<{ user: User; password: string }>;
  createTestAppointment: (patientToken: string, doctorId: number) => Promise<Appointment>;
};

const API_BASE_URL = (process.env.API_URL || 'http://localhost/api/v1').replace(/\/?$/, '/');

export const dataFixtures = base.extend<DataFixtures>({
  createTestUser: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const createdIds: number[] = [];

    const factory = async (role: 'patient' | 'doctor' | 'admin' = 'patient') => {
      const email = randomEmail(role);
      const password = randomPassword();
      const authClient = new AuthClient(apiContext);

      const { response, body } = await authClient.register({
        email,
        password,
        full_name: randomName(),
        role,
      });

      if (response.status() !== 201) {
        throw new Error(`Failed to create test user: ${JSON.stringify(body)}`);
      }

      createdIds.push(body.id);
      return { user: body, password };
    };

    await use(factory);

    // Cleanup: delete created users via admin API
    const adminAuth = new AuthClient(apiContext);
    try {
      await adminAuth.loginAndSetToken(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
      const usersClient = new UsersClient(apiContext);
      usersClient.setToken(adminAuth['token']!);
      for (const id of createdIds) {
        try { await usersClient.deleteUser(id); } catch { /* best effort */ }
      }
    } catch { /* best effort */ }

    await apiContext.dispose();
  },

  createTestAppointment: async ({ playwright }, use) => {
    const apiContext = await playwright.request.newContext({ baseURL: API_BASE_URL });
    const createdIds: number[] = [];

    const factory = async (patientToken: string, doctorId: number): Promise<Appointment> => {
      const apptClient = new AppointmentsClient(apiContext);
      apptClient.setToken(patientToken);

      const [start, end] = futureSlotPair(30, 26 + Math.floor(Math.random() * 48));
      const { response, body } = await apptClient.create({
        doctor_id: doctorId,
        start_time: start,
        end_time: end,
        reason: 'Test appointment (auto-cleanup)',
      });

      if (response.status() !== 201) {
        throw new Error(`Failed to create test appointment: ${JSON.stringify(body)}`);
      }

      createdIds.push(body.id);
      return body;
    };

    await use(factory);

    // Cleanup
    if (createdIds.length > 0) {
      const adminAuth = new AuthClient(apiContext);
      try {
        await adminAuth.loginAndSetToken(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
        const apptClient = new AppointmentsClient(apiContext);
        apptClient.setToken(adminAuth['token']!);
        for (const id of createdIds) {
          try { await apptClient.deleteAppointment(id); } catch { /* best effort */ }
        }
      } catch { /* best effort */ }
    }

    await apiContext.dispose();
  },
});
