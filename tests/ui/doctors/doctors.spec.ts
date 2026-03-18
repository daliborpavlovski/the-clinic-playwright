import { test, expect } from '../../../src/fixtures/index';
import { DoctorsListPage } from '../../../src/pages/doctors/doctors-list.page';

test.describe('UI — Doctors', () => {
  test('@smoke doctor listing page loads with doctor cards', async ({ page }) => {
    const doctorsPage = new DoctorsListPage(page);
    await doctorsPage.navigate();
    await doctorsPage.waitForLoaded();

    const cards = await doctorsPage.getDoctorCards();
    expect(cards.length).toBeGreaterThan(0);
  });

  test('doctor profile card shows specialty and name', async ({ page, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const doctorsPage = new DoctorsListPage(page);
    await doctorsPage.navigate();
    await doctorsPage.waitForLoaded();

    const card = page.getByTestId(`doctor-card-${doctor.id}`);
    await expect(card).toBeVisible();
    await expect(card).toContainText('General Practice');
  });

  test('view available slots modal opens', async ({ page, doctorApi }) => {
    const { body: doctor } = await doctorApi.users.getMe();
    const doctorsPage = new DoctorsListPage(page);
    await doctorsPage.navigate();
    await doctorsPage.waitForLoaded();

    await doctorsPage.clickViewSlots(doctor.id);
    await doctorsPage.expectSlotsModalVisible();
    await doctorsPage.closeSlotsModal();
  });
});
