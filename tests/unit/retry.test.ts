import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/errors.js';
import { isRetryable, retryAfterMs, withRetry } from '../../src/infra/retry.js';

describe('retry policy', () => {
  it('only retries rate limits and timeouts', async () => {
    const calls = vi.fn(async () => { throw new AppError('UPSTREAM_BAD_RESPONSE', 'bad response'); });
    const sleep = vi.fn(async () => {});
    await expect(withRetry(calls, { retries: 2, sleep })).rejects.toMatchObject({ code: 'UPSTREAM_BAD_RESPONSE' });
    expect(calls).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('uses Retry-After seconds and HTTP dates', async () => {
    expect(retryAfterMs(new Headers({ 'retry-after': '3' }))).toBe(3000);
    const date = new Date(Date.now() + 5000).toUTCString();
    expect(retryAfterMs(new Headers({ 'retry-after': date }))).toBeGreaterThanOrEqual(3000);
    expect(retryAfterMs(new Headers({ 'retry-after': 'not-a-delay' }))).toBeUndefined();
  });

  it('retries timeout twice and preserves the final error', async () => {
    const error = new AppError('UPSTREAM_TIMEOUT', 'timeout');
    const calls = vi.fn(async () => { throw error; });
    const sleep = vi.fn(async () => {});
    await expect(withRetry(calls, { retries: 2, sleep })).rejects.toBe(error);
    expect(calls).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(isRetryable(new AppError('UPSTREAM_NETWORK_ERROR', 'network'))).toBe(false);
  });
});
