import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private readonly emailInput = this.page.getByTestId('email-input');
  private readonly passwordInput = this.page.getByTestId('password-input');
  private readonly loginBtn = this.page.getByTestId('login-btn');
  private readonly registerLink = this.page.getByTestId('register-link');
  private readonly alertContainer = this.page.locator('#alert-container');

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto('/index.html');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginBtn.click();
  }

  async expectErrorMessage(text: string) {
    await expect(this.alertContainer).toContainText(text);
  }

  async expectLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginBtn).toBeVisible();
  }

  async expectRegisterLinkVisible() {
    await expect(this.registerLink).toBeVisible();
  }
}
