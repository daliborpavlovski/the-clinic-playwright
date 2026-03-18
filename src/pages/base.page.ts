import { Page, expect } from '@playwright/test';

/**
 * Base Page Object — shared utilities for all page objects.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Wait for all network requests to settle. */
  async waitForNetworkIdle(timeout = 5000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /** Take a screenshot with a descriptive name. */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /** Assert the page is at the expected URL path. */
  async expectToBeOnPage(urlPart: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  }

  /** Navigate and wait for network idle. */
  async goto(url: string) {
    await this.page.goto(url);
    await this.waitForNetworkIdle();
  }

  /** Get visible text of a locator. */
  async getText(selector: string): Promise<string> {
    return this.page.locator(selector).innerText();
  }

  /** Check if an element is visible. */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }
}
