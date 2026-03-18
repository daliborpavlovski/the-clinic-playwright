import { test, expect } from '../../../src/fixtures/index';
import { DashboardPage } from '../../../src/pages/dashboard.page';

test.describe('Visual — Dashboard Page', () => {
  test('patient dashboard matches baseline snapshot', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.navigate();
    await dashboard.expectLoaded();

    // Mask dynamic content (timestamps, stat numbers) to avoid flakiness
    await expect(page).toHaveScreenshot('patient-dashboard.png', {
      fullPage: true,
      threshold: 0.2,
      mask: [
        page.locator('#stat-total'),
        page.locator('#stat-pending'),
        page.locator('#stat-confirmed'),
        page.locator('#stat-completed'),
        page.locator('#recent-appointments table tbody'),
        page.locator('#topbar-greeting'),
      ],
    });
  });
});
