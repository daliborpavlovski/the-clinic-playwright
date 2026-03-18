/**
 * Auth setup — runs as the 'setup' project before all UI tests.
 * Logs in each role via API and saves storageState to .auth/.
 *
 * Deliberately browser-free: storageState is written directly as JSON
 * so this project works on any browser runner (Firefox, WebKit, Chromium)
 * without needing to install Chromium on every CI job.
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
) {
  const baseUrl = process.env.BASE_URL || 'http://localhost';
  const apiUrl = `${baseUrl}/api/v1`;

  // Login via API
  const res = await request.post(`${apiUrl}/auth/login`, {
    data: { email, password },
  });
  expect(res.status(), `Login failed for ${email}: ${await res.text()}`).toBe(200);
  const tokens = await res.json();

  // Fetch the full user profile (includes id, needed by frontend canCancel checks)
  const meRes = await request.get(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  expect(meRes.status(), `Failed to fetch /users/me for ${email}`).toBe(200);
  const user = await meRes.json();

  // Write storageState JSON directly — no browser launch required.
  // This format is exactly what Playwright reads when loading storageState.
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: baseUrl,
        localStorage: [
          { name: 'clinic_token', value: tokens.access_token },
          { name: 'clinic_user', value: JSON.stringify(user) },
        ],
      },
    ],
  };

  fs.writeFileSync(path.join(AUTH_DIR, fileName), JSON.stringify(storageState, null, 2));
  console.log(`  ✓ Auth state saved: .auth/${fileName}`);
}

setup('authenticate as patient', async ({ request }) => {
  await saveAuthState(request, process.env.PATIENT_EMAIL!, process.env.PATIENT_PASSWORD!, 'patient.json');
});

setup('authenticate as doctor', async ({ request }) => {
  await saveAuthState(request, process.env.DOCTOR_EMAIL!, process.env.DOCTOR_PASSWORD!, 'doctor.json');
});

setup('authenticate as admin', async ({ request }) => {
  await saveAuthState(request, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!, 'admin.json');
});
