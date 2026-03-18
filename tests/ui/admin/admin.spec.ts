import { test, expect } from '../../../src/fixtures/index';
import { AdminPanelPage } from '../../../src/pages/admin/admin-panel.page';
import { loginAndGoto } from '../../../src/utils/ui-auth.utils';

const BASE = process.env.BASE_URL || 'http://localhost';

test.describe('UI — Admin: User Management', () => {
  test('@smoke admin panel loads user list', async ({ page }) => {
    await loginAndGoto(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!, `${BASE}/admin.html`);

    const adminPage = new AdminPanelPage(page);
    await adminPage.waitForLoaded();
    await adminPage.expectUserCount(3);
  });

  test('admin can deactivate a user', async ({ page, createTestUser }) => {
    const { user: newUser } = await createTestUser('patient');
    await loginAndGoto(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!, `${BASE}/admin.html`);

    const adminPage = new AdminPanelPage(page);
    await adminPage.waitForLoaded();

    await adminPage.deactivateUser(newUser.id);
    await adminPage.expectSuccessAlert('deactivated');
  });
});
