import { test, expect } from '../../../src/fixtures/index';
import { futureSlotPair } from '../../../src/utils/date.utils';
import { randomEmail, randomName, randomPassword } from '../../../src/utils/random.utils';
import { AuthClient } from '../../../src/api/client/auth.client';
import { AppointmentsClient } from '../../../src/api/client/appointments.client';

test.describe('API — Appointments: Status Machine', () => {
  test('pending → confirmed is valid transition (doctor)', async ({ patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 200);

    const { body: appt } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
    });
    expect(appt.status).toBe('pending');

    const { response, body } = await doctorApi.appointments.updateStatus(appt.id, 'confirmed');
    expect(response.status()).toBe(200);
    expect(body.status).toBe('confirmed');

    // Cleanup
    await patientApi.appointments.deleteAppointment(appt.id);
  });

  test('confirmed → pending is invalid transition returns 400', async ({ patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 250);

    const { body: appt } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
    });

    // First confirm it
    await doctorApi.appointments.updateStatus(appt.id, 'confirmed');

    // Try to go back to pending — should fail
    const { response } = await doctorApi.appointments.updateStatus(appt.id, 'pending');
    expect(response.status()).toBe(400);

    // Cleanup
    await patientApi.appointments.deleteAppointment(appt.id);
  });

  test('double-booking same slot returns 409', async ({ patientApi, doctorApi, request }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 300);

    // First booking succeeds
    const { body: first } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
    });
    expect(first.id).toBeTruthy();

    // Second booking at same slot → 409
    const { response } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
    });
    expect(response.status()).toBe(409);

    // Cleanup
    await patientApi.appointments.deleteAppointment(first.id);
  });

  test('cross-user delete appointment returns 403', async ({ patientApi, doctorApi, createTestUser, request }) => {
    const { user: otherPatient, password } = await createTestUser('patient');
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 350);

    // Other patient creates appointment
    const otherAuth = new AuthClient(request);
    const tokens = await otherAuth.loginAndSetToken(otherPatient.email, password);
    const otherAppts = new AppointmentsClient(request);
    otherAppts.setToken(tokens.access_token);

    const { body: appt } = await otherAppts.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
    });

    // Original patient tries to delete it → 403
    const { response } = await patientApi.appointments.deleteAppointment(appt.id);
    expect(response.status()).toBe(403);

    // Cleanup by owner
    await otherAppts.deleteAppointment(appt.id);
  });
});
