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

export const dataFixtures = base.extend<DataFixtures>({
  createTestUser: async ({ request }, use) => {
    const createdIds: number[] = [];

    const factory = async (role: 'patient' | 'doctor' | 'admin' = 'patient') => {
      const email = randomEmail(role);
      const password = randomPassword();
      const authClient = new AuthClient(request);

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

    // Cleanup: deactivate created users via admin API
    // (Best effort — test isolation without requiring delete permission)
    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;
    const adminAuth = new AuthClient(request);
    try {
      await adminAuth.loginAndSetToken(adminEmail, adminPassword);
      const usersClient = new UsersClient(request);
      usersClient.setToken(adminAuth['token']!);
      for (const id of createdIds) {
        try {
          await usersClient.deleteUser(id);
        } catch {
          // Best effort
        }
      }
    } catch {
      // Best effort
    }
  },

  createTestAppointment: async ({ request }, use) => {
    const createdIds: number[] = [];

    const factory = async (patientToken: string, doctorId: number): Promise<Appointment> => {
      const apptClient = new AppointmentsClient(request);
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
      const adminEmail = process.env.ADMIN_EMAIL!;
      const adminPassword = process.env.ADMIN_PASSWORD!;
      const adminAuth = new AuthClient(request);
      try {
        await adminAuth.loginAndSetToken(adminEmail, adminPassword);
        const apptClient = new AppointmentsClient(request);
        apptClient.setToken(adminAuth['token']!);
        for (const id of createdIds) {
          try {
            await apptClient.deleteAppointment(id);
          } catch {
            // Best effort
          }
        }
      } catch {
        // Best effort
      }
    }
  },
});
