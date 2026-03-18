import { test, expect } from '../../src/fixtures/index';
import { AppointmentsListPage } from '../../src/pages/appointments/appointments-list.page';

test.describe('Visual — Appointments Page', () => {
  test('appointments list matches baseline snapshot', async ({ page }) => {
    const apptPage = new AppointmentsListPage(page);
    await apptPage.navigate();
    await apptPage.waitForTableLoaded();

    await expect(page).toHaveScreenshot('appointments-list.png', {
      fullPage: true,
      threshold: 0.2,
      mask: [
        // Mask dynamic date cells
        page.locator('#appt-table-body td:first-child'),
      ],
    });
  });
});
