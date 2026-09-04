import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['dist/index.js'],
  env: { ...process.env, AGNES_API_KEY: 'smoke-test-key' },
});
const client = new Client({ name: 'agnes-image-mcp-smoke-test', version: '0.1.0' });

try {
  await client.connect(transport);
  const response = await client.listTools();
  const names = response.tools.map((tool) => tool.name);
  const expected = ['generate_images'];
  const missing = expected.filter((name) => !names.includes(name));
  const unexpected = names.filter((name) => !expected.includes(name));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(`Tool contract mismatch; missing=${missing.join(', ') || 'none'}, unexpected=${unexpected.join(', ') || 'none'}`);
  }
  console.log(`stdio smoke test passed (${names.length} tools)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
