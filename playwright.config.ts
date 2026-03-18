import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

// Load environment config
const env = process.env.TEST_ENV || 'local';
dotenv.config({ path: path.resolve(__dirname, `config/environments/${env}.env`) });

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const API_URL = process.env.API_URL || 'http://localhost/api/v1';
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['./reporters/custom-reporter.ts'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // ── 1. Auth setup (must run first, generates storageState for all roles)
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { baseURL: BASE_URL },
    },

    // ── 2. UI projects (depend on setup)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/patient.json',
      },
      dependencies: ['setup'],
      testMatch: 'tests/ui/**/*.spec.ts',
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/patient.json',
      },
      dependencies: ['setup'],
      testMatch: 'tests/ui/**/*.spec.ts',
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/patient.json',
      },
      dependencies: ['setup'],
      testMatch: 'tests/ui/**/*.spec.ts',
    },

    // ── 3. API project (no browser, no storageState needed)
    {
      name: 'api',
      use: {
        // Headless — no browser launched
        baseURL: API_URL,
      },
      testMatch: 'tests/api/**/*.spec.ts',
    },

    // ── 4. Visual regression (Chromium only, patient auth)
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/patient.json',
      },
      dependencies: ['setup'],
      testMatch: 'tests/visual/**/*.spec.ts',
    },
  ],
});
