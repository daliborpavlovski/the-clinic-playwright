import { test, expect } from '../../src/fixtures/index';

test.describe('Visual — Login Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page matches baseline snapshot', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      threshold: 0.2,
    });
  });
});
