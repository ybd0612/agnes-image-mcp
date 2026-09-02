import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import { createServer } from '../../src/server.ts';

process.env.AGNES_API_KEY = 'test-key';

describe('MCP server registration', () => {
  it('advertises all tools with strict schemas, output schemas, and annotations', async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(['generate_image', 'generate_images', 'download_image', 'validate_image']);
    for (const tool of tools) {
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.outputSchema).toMatchObject({ type: 'object', additionalProperties: false });
      expect(tool.annotations).toBeDefined();
    }
    expect(tools.find((tool) => tool.name === 'validate_image')?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true });
    await client.close();
    await server.close();
  });

  it('rejects unknown fields at the MCP boundary', async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const response = await client.callTool({ name: 'validate_image', arguments: { path: 'package.json', unknown: true } });
    expect(response.isError).toBe(true);
    await client.close();
    await server.close();
  });

  it('returns structured content matching the declared output schema', async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const response = await client.callTool({ name: 'validate_image', arguments: { path: 'package.json' } });
    expect(response.structuredContent).toMatchObject({ code: 'INVALID_IMAGE', data: { valid: false } });
    expect(response.content[0]).toMatchObject({ type: 'text' });
    await client.close();
    await server.close();
  });
});
