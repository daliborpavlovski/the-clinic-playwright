import { Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class DoctorsListPage extends BasePage {
  private readonly doctorsGrid = this.page.locator('#doctors-grid');
  private readonly slotsModal = this.page.locator('#modal-slots');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/doctors.html');
  }

  async waitForLoaded() {
    await expect(this.doctorsGrid).not.toContainText('Loading');
  }

  async getDoctorCards() {
    return this.page.locator('[data-testid^="doctor-card-"]').all();
  }

  async clickViewSlots(doctorId: number) {
    await this.page.getByTestId(`view-slots-btn-${doctorId}`).click();
    await expect(this.slotsModal).toBeVisible();
  }

  async expectSlotsModalVisible() {
    await expect(this.slotsModal).toBeVisible();
  }

  async closeSlotsModal() {
    await this.slotsModal.locator('button', { hasText: 'Close' }).click();
  }
}
