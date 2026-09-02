import { describe, expect, it, vi } from 'vitest';
import { RateLimiter } from '../../src/infra/rate-limiter.ts';

describe('RateLimiter', () => {
  it('serializes requests within each size bucket', async () => {
    const waits: number[] = [];
    const limiter = new RateLimiter(async (ms) => { waits.push(ms); });
    await Promise.all([limiter.acquire('1K'), limiter.acquire('1K')]);
    expect(waits).toEqual([3000, 3000]);
  });

  it('keeps size buckets independent', async () => {
    const waits: number[] = [];
    const limiter = new RateLimiter(async (ms) => { waits.push(ms); });
    await Promise.all([limiter.acquire('1K'), limiter.acquire('2K')]);
    expect(waits.sort((a, b) => a - b)).toEqual([3000, 6000]);
    expect(RateLimiter.interval('3K')).toBe(60000);
  });
});
