import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { downloadImage } from '../../src/services/download-service.ts';
import { validateImage } from '../../src/services/validation-service.ts';
import { AgnesProvider } from '../../src/providers/agnes-provider.ts';

const config = { apiKey: 'fake-key', model: 'default-model', endpoint: 'https://mock.example/generate' };

describe('security guards', () => {
  it('rejects DNS resolutions to private addresses before fetching', async () => {
    const fetchMock = async () => new Response('unexpected');
    const resolver = { lookup: async () => [{ address: '127.0.0.1', family: 4 }] };
    await expect(downloadImage({ url: 'https://public.example/image.png', outputPath: 'security-test.png', maxBytes: 1024 }, fetchMock, resolver)).rejects.toMatchObject({ code: 'IMAGE_DOWNLOAD_FAILED' });
  });

  it('rejects malformed WebP signatures', async () => {
    const file = path.join(process.cwd(), 'security-test.webp');
    await fs.writeFile(file, Buffer.from('RIFFxxxxxxxx'));
    try { await expect(validateImage({ path: 'security-test.webp', maxBytes: 1024 })).resolves.toMatchObject({ valid: false }); }
    finally { await fs.rm(file, { force: true }); }
  });

  it('limits upstream response size', async () => {
    const fetchMock = async () => new Response('x'.repeat(20), { status: 200, headers: { 'content-length': '20' } });
    const provider = new AgnesProvider(config, fetchMock, 1000, 10);
    await expect(provider.generate({ prompt: 'a cat', size: '1K' })).rejects.toMatchObject({ code: 'UPSTREAM_BAD_RESPONSE' });
  });
});
