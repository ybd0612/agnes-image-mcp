import { describe, expect, it } from 'vitest';
import { generateBatch } from '../../src/services/batch-service.ts';
import { AppError } from '../../src/errors.ts';

const image = { model: 'm', size: '1K' as const, output: 'url' as const, url: 'https://example.test/image.png', base64: null, revisedPrompt: null };

function download() {
  return Promise.resolve({ path: 'output/image.png', bytes: 123, mimeType: 'image/png', sha256: 'hash' });
}

describe('batch contract', () => {
  it('allows omitted ids and reports skipped stop-on-error items', async () => {
    let calls = 0;
    const service = { generate: async () => { calls++; if (calls === 1) throw new AppError('UPSTREAM_TIMEOUT', 'timeout'); return image; } } as never;
    const result = await generateBatch(service, { items: [
      { prompt: 'one', size: '1K', ratio: '1:1' },
      { id: 'two', prompt: 'two', size: '1K', ratio: '1:1' },
      { id: 'three', prompt: 'three', size: '1K', ratio: '1:1' },
    ], continueOnError: false }, download);
    expect(result.data).toMatchObject({ requestedCount: 3, succeededCount: 0, failedCount: 1, skippedCount: 2 });
    expect(result.data.results[0]).not.toHaveProperty('id');
    expect(calls).toBe(1);
  });

  it('downloads and reports the validated local file for successful generation', async () => {
    const service = { generate: async () => image } as never;
    const result = await generateBatch(service, { items: [{ prompt: 'one', size: '1K', ratio: '1:1' }], continueOnError: false }, download);
    expect(result.data).toMatchObject({ succeededCount: 1, failedCount: 0, results: [{ success: true, file: { path: 'output/image.png', validated: true } }] });
  });
});
