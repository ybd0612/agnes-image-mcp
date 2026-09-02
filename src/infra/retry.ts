import { AppError } from '../errors.js';
export interface RetryOptions { retries: number; retryAfter?: (attempt: number, error: unknown) => number | undefined; sleep?: (ms: number) => Promise<void>; }
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(r => setTimeout(r, ms)));
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); } catch (error) {
      if (attempt >= options.retries) throw error;
      const delay = options.retryAfter?.(attempt, error) ?? Math.min(1000 * 2 ** attempt, 30000);
      await sleep(Math.max(0, delay));
    }
  }
}
export function retryAfterMs(headers: Headers, attempt: number): number | undefined {
  const value = headers.get('retry-after');
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 120000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
}
export function isRetryable(error: unknown): boolean { return error instanceof AppError && ['UPSTREAM_RATE_LIMIT','UPSTREAM_TIMEOUT'].includes(error.code); }
