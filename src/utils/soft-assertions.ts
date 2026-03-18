import { expect } from '@playwright/test';

interface SoftAssertion {
  label: string;
  fn: () => void | Promise<void>;
}

/**
 * Collect multiple soft assertions and throw all failures at once.
 *
 * Usage:
 *   const soft = new SoftAssertions();
 *   soft.add('title visible', () => expect(page.locator('h1')).toBeVisible());
 *   soft.add('status badge', () => expect(page.locator('.badge')).toHaveText('pending'));
 *   await soft.assertAll();
 */
export class SoftAssertions {
  private assertions: SoftAssertion[] = [];

  add(label: string, fn: () => void | Promise<void>): this {
    this.assertions.push({ label, fn });
    return this;
  }

  async assertAll(): Promise<void> {
    const failures: string[] = [];

    for (const { label, fn } of this.assertions) {
      try {
        await fn();
      } catch (err) {
        failures.push(`  ✗ ${label}: ${(err as Error).message}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(`${failures.length} soft assertion(s) failed:\n${failures.join('\n')}`);
    }
  }
}
