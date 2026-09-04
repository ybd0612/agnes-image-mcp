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
    expect(tools.map((tool) => tool.name)).toEqual(['generate_images']);
    for (const tool of tools) {
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.outputSchema).toMatchObject({ type: 'object', additionalProperties: false });
      expect(tool.annotations).toBeDefined();
    }
    await client.close();
    await server.close();
  });

  it('rejects unknown fields at the MCP boundary', async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const response = await client.callTool({ name: 'generate_images', arguments: { items: [{ prompt: 'test', unknown: true }] } });
    expect(response.isError).toBe(true);
    await client.close();
    await server.close();
  });

  it('advertises the unified items input and structured output', async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    expect(tools[0]?.inputSchema.required).toContain('items');
    expect(tools[0]?.inputSchema.properties).toHaveProperty('items');
    expect(tools[0]?.outputSchema).toMatchObject({ type: 'object', additionalProperties: false });
    await client.close();
    await server.close();
  });
});
