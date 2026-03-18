import { test, expect } from '../../../src/fixtures/index';
import { AppointmentsListPage } from '../../../src/pages/appointments/appointments-list.page';
import { futureSlotPair, pastSlot } from '../../../src/utils/date.utils';

test.describe('UI — Appointments: Booking', () => {
  test('@smoke patient can book a valid future appointment', async ({ page }) => {
    const apptPage = new AppointmentsListPage(page);
    await apptPage.navigate();
    await apptPage.waitForTableLoaded();

    // Use a random offset (100–200h) so repeated runs don't conflict on the same slot
    const [start, end] = futureSlotPair(30, 100 + Math.floor(Math.random() * 100));
    await apptPage.bookAppointment({ startIso: start, endIso: end, reason: 'UI test - routine checkup' });

    await apptPage.expectSuccessAlert();
    await apptPage.waitForTableLoaded();
    await apptPage.expectRowWithStatus('pending');
  });

  test('booking a past time slot shows error', async ({ page }) => {
    const apptPage = new AppointmentsListPage(page);
    await apptPage.navigate();
    await apptPage.waitForTableLoaded();

    const pastStart = pastSlot(48);
    const pastEnd = pastSlot(47);
    await apptPage.bookAppointment({ startIso: pastStart, endIso: pastEnd, reason: 'Past slot test' });

    await apptPage.expectErrorAlert('future');
  });

  test('patient can cancel a pending appointment', async ({ page, patientApi, doctorApi }) => {
    // Create appointment via API for test isolation
    const { body: doctor } = await doctorApi.users.getMe();
    const [start, end] = futureSlotPair(30, 72);
    const { body: appt } = await patientApi.appointments.create({
      doctor_id: doctor.id,
      start_time: start,
      end_time: end,
      reason: 'Cancel UI test',
    });

    const apptPage = new AppointmentsListPage(page);
    await apptPage.navigate();
    await apptPage.waitForTableLoaded();

    // Verify appointment is visible and cancel it
    await expect(page.locator('#appt-table-body')).toContainText('Cancel UI test');

    // Handle confirm dialog
    page.on('dialog', (d) => d.accept());
    await page.getByTestId(`cancel-btn-${appt.id}`).click();

    await apptPage.waitForTableLoaded();
    await expect(page.locator('#appt-table-body')).toContainText('cancelled');
  });
});
