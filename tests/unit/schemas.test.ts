import { describe, expect, it } from 'vitest';
import { generateImagesSchema } from '../../src/schemas/generate-images.ts';
import { downloadImageSchema } from '../../src/schemas/download-image.ts';
import { validateImageSchema } from '../../src/schemas/validate-image.ts';

describe('tool schemas', () => {
  it('accepts one item as the single-image form and applies defaults', () => {
    const value = generateImagesSchema.parse({ items: [{ prompt: 'a cat' }] });
    expect(value).toMatchObject({ continueOnError: false, items: [{ size: '1K', ratio: '1:1' }] });
  });

  it('rejects unsupported sizes, ratios, empty items, and unknown fields', () => {
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', size: '8K' }] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', ratio: '5:7' }] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', unknown: true }] })).toThrow();
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
