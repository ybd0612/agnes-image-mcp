import { describe, expect, it } from 'vitest';
import { generateBatch } from '../../src/services/batch-service.ts';
import { AppError } from '../../src/errors.ts';

const image = { model: 'm', size: '1K' as const, output: 'url' as const, url: 'https://example.test/image.png', base64: null, revisedPrompt: null };

describe('batch contract', () => {
  it('allows omitted ids and reports skipped stop-on-error items', async () => {
    let calls = 0;
    const service = { generate: async () => { calls++; if (calls === 1) throw new AppError('UPSTREAM_TIMEOUT', 'timeout'); return image; } } as never;
    const result = await generateBatch(service, { items: [
      { prompt: 'one', size: '1K', output: 'url' },
      { id: 'two', prompt: 'two', size: '1K', output: 'url' },
      { id: 'three', prompt: 'three', size: '1K', output: 'url' },
    ], continueOnError: false, concurrency: 1 });
    expect(result.data).toMatchObject({ requestedCount: 3, succeededCount: 0, failedCount: 1, skippedCount: 2 });
    expect(result.data.results[0]).not.toHaveProperty('id');
    expect(calls).toBe(1);
  });
});
