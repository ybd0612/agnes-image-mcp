import { describe, expect, it } from 'vitest';
import { generateImagesSchema } from '../../src/schemas/generate-images.js';

describe('generate_images schema', () => {
  it('accepts one item as the single-image form and applies defaults', () => {
    const value = generateImagesSchema.parse({ items: [{ prompt: 'a cat' }] });
    expect(value).toMatchObject({ continueOnError: false, items: [{ size: '1K', ratio: '1:1' }] });
  });

  it('accepts multiple items as the batch form', () => {
    const value = generateImagesSchema.parse({ items: [{ prompt: 'a cat' }, { prompt: 'a dog', size: '2K' }] });
    expect(value.items).toHaveLength(2);
    expect(value.items[1]).toMatchObject({ size: '2K', ratio: '1:1' });
  });

  it('rejects unsupported sizes, ratios, empty items, and unknown fields', () => {
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', size: '8K' }] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', ratio: '5:7' }] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: [{ prompt: 'x', unknown: true }] })).toThrow();
    expect(() => generateImagesSchema.parse({ items: new Array(11).fill({ prompt: 'x' }) })).toThrow();
  });
});
