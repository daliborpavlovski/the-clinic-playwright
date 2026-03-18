import { mergeTests, mergeExpects } from '@playwright/test';
import { authFixtures } from './auth.fixtures';
import { apiFixtures } from './api.fixtures';
import { dataFixtures } from './data.fixtures';

/**
 * Single merged fixture export.
 * ALL test files import `{ test, expect }` from here — never from @playwright/test directly.
 *
 * This ensures:
 * 1. All fixtures are available everywhere
 * 2. A single import keeps test files clean
 * 3. Adding new fixtures doesn't require updating every test file
 */
export const test = mergeTests(authFixtures, apiFixtures, dataFixtures);
export { expect } from '@playwright/test';
