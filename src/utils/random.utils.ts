import crypto from 'crypto';

/** Generate a random email address suitable for test user creation. */
export function randomEmail(prefix = 'test'): string {
  const id = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${id}@test-theclinicapp.com`;
}

/** Generate a random full name. */
export function randomName(): string {
  const first = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Hank'];
  const last = ['Smith', 'Jones', 'Brown', 'Wilson', 'Taylor', 'Moore', 'Anderson', 'White'];
  const f = first[Math.floor(Math.random() * first.length)];
  const l = last[Math.floor(Math.random() * last.length)];
  return `${f} ${l}`;
}

/** Generate a valid password (meets The Clinic App requirements). */
export function randomPassword(): string {
  const id = crypto.randomBytes(4).toString('hex');
  return `TestPass${id}1`;
}

/** Generate a random alphanumeric string of length n. */
export function randomString(n = 8): string {
  return crypto.randomBytes(n).toString('base64url').slice(0, n);
}
