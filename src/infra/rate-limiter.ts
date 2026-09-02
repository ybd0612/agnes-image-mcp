import type { Size } from '../types/image.js';
const intervals: Record<Size, number> = { '1K': 3000, '2K': 6000, '3K': 60000, '4K': 60000 };
export class RateLimiter {
  private tails = new Map<Size, Promise<void>>();
  constructor(private readonly sleep: (ms: number) => Promise<void> = (ms) => new Promise(r => setTimeout(r, ms))) {}
  async acquire(size: Size): Promise<void> {
    const previous = this.tails.get(size) ?? Promise.resolve();
    const current = previous.then(() => this.sleep(intervals[size]));
    this.tails.set(size, current.catch(() => undefined));
    await current;
  }
  static interval(size: Size): number { return intervals[size]; }
}
