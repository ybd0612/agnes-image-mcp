import { describe, expect, it, vi } from 'vitest';
import { AgnesProvider } from '../../src/providers/agnes-provider.ts';

describe('AgnesProvider', () => {
  it('maps URL generation to the official request shape', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        model: 'test-model',
        prompt: 'a cat',
        size: '1K',
        ratio: '1:1',
        extra_body: { response_format: 'url' },
      });
      expect(init?.headers).toMatchObject({ authorization: 'Bearer fake-key' });
      return new Response(JSON.stringify({ id: 'req-1', created: 123, data: [{ url: 'https://cdn.example/cat.png' }] }), { status: 200 });
    });
    const provider = new AgnesProvider({ apiKey: 'fake-key', model: 'default-model', endpoint: 'https://mock.example/generate' }, fetchMock);
    const result = await provider.generate({ prompt: 'a cat', size: '1K', ratio: '1:1', model: 'test-model', output: 'url' });
    expect(result).toMatchObject({ model: 'test-model', requestId: 'req-1', created: 123 });
    expect(result.images).toEqual([{ url: 'https://cdn.example/cat.png', revisedPrompt: null }]);
  });

  it('maps text-to-image base64 output to return_base64', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      expect(body.return_base64).toBe(true);
      expect(body.extra_body).toBeUndefined();
      return new Response(JSON.stringify({ data: [{ b64_json: 'ZmFrZQ==' }] }), { status: 200 });
    });
    const provider = new AgnesProvider({ apiKey: 'fake-key', model: 'default-model', endpoint: 'https://mock.example/generate' }, fetchMock);
    const result = await provider.generate({ prompt: 'a cat', size: '2K', output: 'base64' });
    expect(result.images[0].base64).toBe('ZmFrZQ==');
  });

  it('maps upstream status errors without exposing credentials', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{"error":"nope"}', { status: 401 }));
    const provider = new AgnesProvider({ apiKey: 'super-secret', model: 'default-model', endpoint: 'https://mock.example/generate' }, fetchMock);
    await expect(provider.generate({ prompt: 'a cat', size: '1K' })).rejects.toMatchObject({ code: 'UPSTREAM_AUTH_ERROR' });
  });
});
