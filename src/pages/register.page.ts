import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class RegisterPage extends BasePage {
  private readonly nameInput = this.page.getByTestId('name-input');
  private readonly emailInput = this.page.getByTestId('email-input');
  private readonly passwordInput = this.page.getByTestId('password-input');
  private readonly registerBtn = this.page.getByTestId('register-btn');
  private readonly alertContainer = this.page.locator('#alert-container');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/register.html');
  }

  async register(fullName: string, email: string, password: string) {
    await this.nameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.registerBtn.click();
  }

  async expectErrorMessage(text: string) {
    await expect(this.alertContainer).toContainText(text);
  }

  async expectSuccessMessage() {
    await expect(this.alertContainer).toContainText('Account created');
  }
}
