// Retries a flaky operation (e.g. a database call) a few times with a short wait.
// The number of attempts is returned so the UI can show "retried" on the chip.
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 400 } = {},
): Promise<{ value: T; attempts: number }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return { value: await fn(), attempts: attempt };
    } catch (err) {
      lastError = err;
      if (attempt < attempts) await new Promise((r) => setTimeout(r, delayMs * attempt));
    }
  }
  throw lastError;
}
