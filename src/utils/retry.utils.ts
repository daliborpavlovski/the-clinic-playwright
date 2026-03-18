/**
 * Retry a flaky async operation up to `maxAttempts` times.
 * Useful for operations that depend on async side-effects (e.g. email delivery, cache expiry).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    maxAttempts = 3,
    delayMs = 1000,
    onRetry,
  }: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {},
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw lastError;
}
