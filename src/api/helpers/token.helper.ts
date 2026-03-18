/**
 * Lightweight JWT decode (no signature verification — only for test assertions).
 * Never use this in production code.
 */
export function decodeJwt(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Invalid JWT: missing payload segment');
  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JWT: payload is not valid base64url-encoded JSON');
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  const exp = payload['exp'] as number | undefined;
  if (exp === undefined) return false;
  return Date.now() / 1000 > exp;
}

export function getTokenRole(token: string): string | undefined {
  const payload = decodeJwt(token);
  return payload['role'] as string | undefined;
}

export function getTokenSubject(token: string): string | undefined {
  const payload = decodeJwt(token);
  return payload['sub'] as string | undefined;
}
