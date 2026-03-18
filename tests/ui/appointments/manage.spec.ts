import { test, expect } from '../../../src/fixtures/index';
import { futureSlotPair } from '../../../src/utils/date.utils';
import { loginAndGoto } from '../../../src/utils/ui-auth.utils';

const BASE = process.env.BASE_URL || 'http://localhost';

test.describe('UI — Appointments: Doctor actions', () => {
  test('doctor can confirm a pending appointment', async ({ page, patientApi, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 200);

    const { body: appt } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
      reason: 'Doctor confirm UI test',
    });

    const doctorPage = await page.context().newPage();
    await loginAndGoto(doctorPage, process.env.DOCTOR_EMAIL!, process.env.DOCTOR_PASSWORD!, `${BASE}/appointments.html`);

    await doctorPage.waitForSelector('#appt-table-body:not(:has-text("Loading"))');
    await expect(doctorPage.locator('#appt-table-body')).toContainText('Doctor confirm UI test');

    await doctorPage.getByTestId(`confirm-btn-${appt.id}`).click();
    await doctorPage.waitForSelector('#appt-table-body:not(:has-text("Loading"))');

    await expect(doctorPage.locator('#appt-table-body')).toContainText('confirmed');
    await doctorPage.close();

    // Cleanup
    await patientApi.appointments.deleteAppointment(appt.id);
  });
});

test.describe('UI — Appointments: Admin visibility', () => {
  test('admin sees all appointments', async ({ page }) => {
    await loginAndGoto(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!, `${BASE}/appointments.html`);
    await page.waitForSelector('#appt-table-body:not(:has-text("Loading"))');

    const rowCount = await page.locator('#appt-table-body tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
