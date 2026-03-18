import { Page, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class AppointmentsListPage extends BasePage {
  private readonly newApptBtn = this.page.getByTestId('new-appointment-btn');
  private readonly tableBody = this.page.locator('#appt-table-body');
  private readonly alertContainer = this.page.locator('#alert-container');
  private readonly bookModal = this.page.getByTestId('book-modal');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/appointments.html');
  }

  async waitForTableLoaded() {
    await expect(this.tableBody).not.toContainText('Loading');
  }

  async clickNewAppointment() {
    await this.newApptBtn.click();
    await expect(this.bookModal).toBeVisible();
  }

  async bookAppointment({
    doctorIndex = 0,
    startIso,
    endIso,
    reason,
  }: {
    doctorIndex?: number;
    startIso: string;
    endIso: string;
    reason?: string;
  }) {
    await this.clickNewAppointment();

    // Wait for doctor dropdown to populate
    await this.page.waitForFunction(() => {
      const sel = document.querySelector('#select-doctor') as HTMLSelectElement;
      return sel && sel.options.length > 1;
    });

    const doctorSelect = this.page.locator('#select-doctor');
    // Select the first real doctor option (index 0 is the placeholder "Select a doctor…")
    await doctorSelect.selectOption({ index: doctorIndex + 1 });

    await this.page.locator('#start-time').fill(toDatetimeLocal(startIso));
    await this.page.locator('#end-time').fill(toDatetimeLocal(endIso));

    if (reason) {
      await this.page.locator('#reason').fill(reason);
    }

    await this.page.getByTestId('confirm-book-btn').click();
  }

  async expectSuccessAlert() {
    await expect(this.alertContainer).toContainText('booked successfully');
  }

  async expectErrorAlert(text?: string) {
    if (text) {
      await expect(this.page.locator('#modal-alert')).toContainText(text);
    } else {
      await expect(this.page.locator('#modal-alert')).toBeVisible();
    }
  }

  async cancelAppointment(id: number) {
    await this.page.getByTestId(`cancel-btn-${id}`).click();
    await this.page.on('dialog', (d) => d.accept());
  }

  async expectRowWithStatus(status: string) {
    await expect(this.tableBody).toContainText(status);
  }
}

function toDatetimeLocal(iso: string): string {
  // Input[type=datetime-local] expects "YYYY-MM-DDTHH:MM"
  return iso.slice(0, 16);
}
