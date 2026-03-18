import { test, expect } from '../../../src/fixtures/index';
import { assertPaginationShape } from '../../../src/api/helpers/response.helper';

test.describe('API — Doctors', () => {
  test('@smoke list doctors returns paginated response', async ({ patientApi }) => {
    const { response, body } = await patientApi.doctors.list(1, 10);
    expect(response.status()).toBe(200);
    assertPaginationShape(body as unknown as Record<string, unknown>);
  });

  test('get doctor by id returns profile schema', async ({ patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();

    const { response, body } = await patientApi.doctors.getById(doctor.id);
    expect(response.status()).toBe(200);
    expect(body.user_id).toBe(doctor.id);
    expect(typeof body.specialty).toBe('string');
    expect(typeof body.slot_duration_minutes).toBe('number');
    expect(Array.isArray(body.available_slots)).toBe(true);
  });

  test('get slots for doctor returns array', async ({ patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();

    const { response, body } = await patientApi.doctors.getSlots(doctor.id);
    expect(response.status()).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test('doctor can update own profile', async ({ doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();

    const { response, body } = await doctorApi.doctors.updateProfile(doctor.id, {
      bio: 'Updated bio from API test',
    });
    expect(response.status()).toBe(200);
    expect(body.bio).toBe('Updated bio from API test');
  });

  test('patient cannot update doctor profile → 403', async ({ patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();

    const { response } = await patientApi.doctors.updateProfile(doctor.id, {
      bio: 'Should not work',
    });
    expect(response.status()).toBe(403);
  });

  test('get non-existent doctor returns 404', async ({ patientApi }) => {
    const { response } = await patientApi.doctors.getById(999999);
    expect(response.status()).toBe(404);
  });
});
