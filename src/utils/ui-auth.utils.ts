import type { Page } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost';

/**
 * Authenticate via API and navigate to a target page with the token in localStorage.
 *
 * Why not use storageState fixtures here: these helpers are used in tests that need
 * a secondary browser page (e.g. a doctor page alongside a patient page), or that
 * verify role-specific UI behaviour in isolation without a pre-built storageState.
 *
 * Flow: POST /auth/login → GET /users/me → set localStorage on a neutral page →
 * navigate to target. Setting localStorage *before* navigating to the protected
 * page avoids redirect loops caused by the auth guard running before evaluate() runs.
 */
export async function loginAndGoto(
  page: Page,
  email: string,
  password: string,
  targetUrl: string,
): Promise<void> {
  const loginRes = await page.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email, password },
  });
  const tokens = await loginRes.json();
  const token: string = tokens.access_token;

  const meRes = await page.request.get(`${BASE}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const user = await meRes.json();

  // Inject credentials via addInitScript so they are written before the target
  // page's own JavaScript runs — no intermediate navigation to index.html needed.
  // This avoids a WebKit race where page.evaluate() fires while the auth guard
  // on index.html is still redirecting, destroying the execution context.
  await page.addInitScript(
    ({ t, u }: { t: string; u: unknown }) => {
      localStorage.setItem('clinic_token', t);
      localStorage.setItem('clinic_user', JSON.stringify(u));
    },
    { t: token, u: user },
  );

  await page.goto(targetUrl);
}
