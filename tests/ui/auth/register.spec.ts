import { test, expect } from '../../../src/fixtures/index';
import { RegisterPage } from '../../../src/pages/register.page';
import { DashboardPage } from '../../../src/pages/dashboard.page';
import { randomEmail, randomName, randomPassword } from '../../../src/utils/random.utils';

test.describe('UI — Auth: Register', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('@smoke new patient can register and is redirected to dashboard', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    await registerPage.register(randomName(), randomEmail('ui-reg'), randomPassword());
    await registerPage.expectSuccessMessage();

    await page.waitForURL('**/dashboard.html', { timeout: 12_000 });
    const dashboard = new DashboardPage(page);
    await dashboard.expectLoaded();
  });

  test('duplicate email registration shows error', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Use known existing email
    await registerPage.register(randomName(), process.env.PATIENT_EMAIL!, randomPassword());
    await registerPage.expectErrorMessage('already registered');
  });
});
