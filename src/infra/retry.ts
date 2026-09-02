import { AppError } from '../errors.js';

export interface RetryOptions { retries: number; retryAfter?: (attempt: number, error: unknown) => number | undefined; sleep?: (ms: number) => Promise<void>; }

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); } catch (error) {
      if (!isRetryable(error) || attempt >= options.retries) throw error;
      const delay = options.retryAfter?.(attempt, error) ?? Math.min(1000 * 2 ** attempt, 30000);
      await sleep(Math.max(0, delay));
    }
  }
}

export function retryAfterValueMs(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Math.min(Number(normalized) * 1000, 120000);
  const date = Date.parse(normalized);
  return Number.isFinite(date) ? Math.min(Math.max(0, date - Date.now()), 120000) : undefined;
}

export function retryAfterMs(headers: Headers, _attempt = 0): number | undefined {
  return retryAfterValueMs(headers.get('retry-after'));
}

export function isRetryable(error: unknown): boolean {
  return error instanceof AppError && (error.code === 'UPSTREAM_RATE_LIMIT' || error.code === 'UPSTREAM_TIMEOUT');
}
