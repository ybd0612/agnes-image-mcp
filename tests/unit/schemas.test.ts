import { describe, expect, it } from 'vitest';
import { generateImageSchema } from '../../src/schemas/generate-image.ts';
import { generateImagesSchema } from '../../src/schemas/generate-images.ts';
import { downloadImageSchema } from '../../src/schemas/download-image.ts';
import { validateImageSchema } from '../../src/schemas/validate-image.ts';

describe('tool schemas', () => {
  it('applies safe generation defaults and rejects unknown fields', () => {
    const value = generateImageSchema.parse({ prompt: 'a cat', size: '1K' });
    expect(value.output).toBe('url');
    expect(() => generateImageSchema.parse({ prompt: 'a cat', size: '1K', unknown: true })).toThrow();
  });

  it('rejects unsupported sizes and ratios', () => {
    expect(() => generateImageSchema.parse({ prompt: 'x', size: '8K' })).toThrow();
    expect(() => generateImageSchema.parse({ prompt: 'x', size: '1K', ratio: '5:7' })).toThrow();
  });

  it('defaults batch execution to serial, retrying twice, and stop-on-error', () => {
    const value = generateImagesSchema.parse({ items: [{ id: 'one', prompt: 'x', size: '2K' }] });
    expect(value).toMatchObject({ continueOnError: false, concurrency: 1 });
    expect(value.items[0].output).toBe('url');
  });

  it('rejects download path traversal and unknown fields', () => {
    expect(() => downloadImageSchema.parse({ url: 'https://example.com/a.png', outputPath: '../a.png' })).not.toThrow();
    expect(() => downloadImageSchema.parse({ url: 'http://example.com/a.png', outputPath: 'a.png' })).toThrow();
    expect(() => downloadImageSchema.parse({ url: 'https://example.com/a.png', outputPath: 'a.png', extra: 1 })).toThrow();
  });

  it('requires a local path and rejects network-oriented fields', () => {
    expect(() => validateImageSchema.parse({})).toThrow();
    expect(() => validateImageSchema.parse({ path: './image.png' })).not.toThrow();
    expect(() => validateImageSchema.parse({ source: './image.png' })).toThrow();
  });
});
