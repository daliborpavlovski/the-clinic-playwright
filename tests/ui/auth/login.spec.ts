import { test, expect } from '../../../src/fixtures/index';
import { LoginPage } from '../../../src/pages/login.page';
import { DashboardPage } from '../../../src/pages/dashboard.page';
import { randomEmail, randomPassword } from '../../../src/utils/random.utils';

test.describe('UI — Auth: Login', () => {
  // These tests use their own fresh browser context (no storageState)
  test.use({ storageState: { cookies: [], origins: [] } });

  test('@smoke valid login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.expectLoginFormVisible();

    await loginPage.login(process.env.PATIENT_EMAIL!, process.env.PATIENT_PASSWORD!);

    await page.waitForURL('**/dashboard.html', { timeout: 10_000 });
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('invalid password shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.login(process.env.PATIENT_EMAIL!, 'WrongPassword999');
    await loginPage.expectErrorMessage('Invalid');
  });

  test('non-existent email shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await loginPage.login(randomEmail('ghost'), randomPassword());
    await loginPage.expectErrorMessage('Invalid');
  });

  test('register link is visible on login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.expectRegisterLinkVisible();
  });
});

test.describe('UI — Auth: Logout', () => {
  test('logout clears token and redirects to login', async ({ page }) => {
    // Start with patient storageState (from fixture default)
    const dashboard = new DashboardPage(page);
    await dashboard.navigate();
    await dashboard.expectLoaded();

    await dashboard.logout();

    // Should be redirected to login
    await page.waitForURL('**/index.html', { timeout: 10_000 });

    // localStorage should be cleared
    const token = await page.evaluate(() => localStorage.getItem('clinic_token'));
    expect(token).toBeNull();
  });
});
