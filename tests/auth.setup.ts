/**
 * Auth setup — runs as the 'setup' project before all UI tests.
 * Logs in each role via API and saves storageState to .auth/.
 *
 * This is the idiomatic Playwright v1.35+ pattern:
 * - Use a 'setup' project with testMatch: "auth.setup.ts"
 * - UI projects declare dependencies: ['setup']
 * - No deprecated globalSetup needed
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.resolve('.auth');

setup.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
});

async function saveAuthState(
  request: Parameters<typeof setup>[1] extends never ? never : any,
  email: string,
  password: string,
  fileName: string,
  page: any
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost';
  const apiUrl = `${baseUrl}/api/v1`;

  // Login via API (not through UI — faster and more reliable for setup)
  const res = await request.post(`${apiUrl}/auth/login`, {
    data: { email, password },
  });

  expect(res.status(), `Login failed for ${email}: ${await res.text()}`).toBe(200);
  const tokens = await res.json();

  // Store the token in localStorage via a minimal page load
  await page.goto(`${baseUrl}/index.html`);
  await page.evaluate(
    ({ token, user }: { token: string; user: object }) => {
      localStorage.setItem('clinic_token', token);
      localStorage.setItem('clinic_user', JSON.stringify(user));
    },
    {
      token: tokens.access_token,
      user: { email, role: email.startsWith('admin') ? 'admin' : email.startsWith('doctor') ? 'doctor' : 'patient', full_name: 'Test User' },
    }
  );

  await page.context().storageState({ path: path.join(AUTH_DIR, fileName) });
  console.log(`  ✓ Auth state saved: .auth/${fileName}`);
}

setup('authenticate as patient', async ({ request, page }) => {
  await saveAuthState(
    request,
    process.env.PATIENT_EMAIL!,
    process.env.PATIENT_PASSWORD!,
    'patient.json',
    page
  );
});

setup('authenticate as doctor', async ({ request, page }) => {
  await saveAuthState(
    request,
    process.env.DOCTOR_EMAIL!,
    process.env.DOCTOR_PASSWORD!,
    'doctor.json',
    page
  );
});

setup('authenticate as admin', async ({ request, page }) => {
  await saveAuthState(
    request,
    process.env.ADMIN_EMAIL!,
    process.env.ADMIN_PASSWORD!,
    'admin.json',
    page
  );
});
