import { Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AdminPanelPage extends BasePage {
  private readonly tableBody = this.page.locator('#users-table-body');
  private readonly alertContainer = this.page.locator('#alert-container');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/admin.html');
  }

  async waitForLoaded() {
    await expect(this.tableBody).not.toContainText('Loading');
  }

  async getUserRows() {
    return this.page.locator('[data-testid^="user-row-"]').all();
  }

  async deactivateUser(userId: number) {
    // Handle confirmation dialog
    this.page.on('dialog', (d) => d.accept());
    await this.page.getByTestId(`deactivate-btn-${userId}`).click();
  }

  async expectSuccessAlert(text?: string) {
    if (text) {
      await expect(this.alertContainer).toContainText(text);
    } else {
      await expect(this.alertContainer).toBeVisible();
    }
  }

  async expectUserCount(min: number) {
    const rows = await this.getUserRows();
    expect(rows.length).toBeGreaterThanOrEqual(min);
  }
}
