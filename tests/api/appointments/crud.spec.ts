import { test, expect } from '../../../src/fixtures/index';
import { futureSlotPair } from '../../../src/utils/date.utils';
import { assertPaginationShape } from '../../../src/api/helpers/response.helper';
import { AuthClient } from '../../../src/api/client/auth.client';
import { AppointmentsClient } from '../../../src/api/client/appointments.client';

test.describe('API — Appointments: CRUD', () => {
  test('@smoke create appointment returns 201 with correct schema', async ({ patientApi, doctorApi }) => {
    // Get doctor user id
    const { body: me } = await doctorApi.users.getMe();
    const doctorId = me.id;

    const [start, end] = futureSlotPair(30, 48);
    const { response, body } = await patientApi.appointments.create({
      doctor_id: doctorId,
      start_time: start,
      end_time: end,
      reason: 'API test appointment',
    });

    expect(response.status()).toBe(201);
    expect(body.id).toBeTruthy();
    expect(body.status).toBe('pending');
    expect(body.doctor_id).toBe(doctorId);
    expect(body.reason).toBe('API test appointment');

    // Cleanup
    await patientApi.appointments.deleteAppointment(body.id);
  });

  test('get appointment as owner returns 200', async ({ patientApi, doctorApi }) => {
    const { body: me } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 72);

    const { body: created } = await patientApi.appointments.create({
      doctor_id: me.id,
      start_time: start,
      end_time: end,
    });
    expect(created.id).toBeTruthy();

    const { response, body } = await patientApi.appointments.getById(created.id);
    expect(response.status()).toBe(200);
    expect(body.id).toBe(created.id);

    await patientApi.appointments.deleteAppointment(created.id);
  });

  test('get another patient appointment returns 403', async ({
    patientApi, doctorApi, createTestUser, request
  }) => {
    const { user: otherPatient, password } = await createTestUser('patient');
    const { body: me } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 96);

    // Other patient books appointment
    const otherAuth = new AuthClient(request);
    const tokens = await otherAuth.loginAndSetToken(otherPatient.email, password);
    const otherAppts = new AppointmentsClient(request);
    otherAppts.setToken(tokens.access_token);

    const { body: created } = await otherAppts.create({
      doctor_id: me.id,
      start_time: start,
      end_time: end,
    });

    // Original patient tries to access it → 403
    const { response } = await patientApi.appointments.getById(created.id);
    expect(response.status()).toBe(403);

    // Cleanup
    await otherAppts.deleteAppointment(created.id);
  });

  test('update appointment notes', async ({ patientApi, doctorApi }) => {
    const { body: me } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 120);

    const { body: created } = await patientApi.appointments.create({
      doctor_id: me.id,
      start_time: start,
      end_time: end,
    });

    const { response, body } = await patientApi.appointments.update(created.id, {
      notes: 'Updated via API test',
    });
    expect(response.status()).toBe(200);
    expect(body.notes).toBe('Updated via API test');

    await patientApi.appointments.deleteAppointment(created.id);
  });

  test('delete appointment then get returns 404', async ({ patientApi, doctorApi }) => {
    const { body: me } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 144);

    const { body: created } = await patientApi.appointments.create({
      doctor_id: me.id,
      start_time: start,
      end_time: end,
    });

    const deleteRes = await patientApi.appointments.deleteAppointment(created.id);
    expect(deleteRes.response.status()).toBe(204);

    const { response } = await patientApi.appointments.getById(created.id);
    expect(response.status()).toBe(404);
  });

  test('list appointments returns paginated response', async ({ patientApi }) => {
    const { response, body } = await patientApi.appointments.list(1, 20);
    expect(response.status()).toBe(200);
    assertPaginationShape(body as unknown as Record<string, unknown>);
  });

  test('list page beyond data returns empty array', async ({ patientApi }) => {
    const { body } = await patientApi.appointments.list(9999, 20);
    expect(body.items).toHaveLength(0);
    expect(body.total).toBeGreaterThanOrEqual(0);
  });
});
