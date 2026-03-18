import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  private readonly statTotal = this.page.locator('#stat-total');
  private readonly statPending = this.page.locator('#stat-pending');
  private readonly statConfirmed = this.page.locator('#stat-confirmed');
  private readonly statCompleted = this.page.locator('#stat-completed');
  private readonly recentAppointments = this.page.locator('#recent-appointments');
  private readonly bookBtn = this.page.getByTestId('book-appointment-btn');
  private readonly logoutBtn = this.page.locator('#btn-logout');
  private readonly sidebarUserName = this.page.locator('#sidebar-user-name');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/dashboard.html');
  }

  async expectLoaded() {
    await expect(this.statTotal).not.toHaveText('—');
    await expect(this.recentAppointments).not.toContainText('Loading');
  }

  async getStats() {
    return {
      total: await this.statTotal.innerText(),
      pending: await this.statPending.innerText(),
      confirmed: await this.statConfirmed.innerText(),
      completed: await this.statCompleted.innerText(),
    };
  }

  async logout() {
    await this.logoutBtn.click();
  }

  async expectUserName(name: string) {
    await expect(this.sidebarUserName).toContainText(name);
  }

  async clickBookAppointment() {
    await this.bookBtn.click();
  }
}
