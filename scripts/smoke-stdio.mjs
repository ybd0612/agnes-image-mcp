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
  const expected = ['generate_image', 'generate_images', 'download_image', 'validate_image'];
  const missing = expected.filter((name) => !names.includes(name));
  if (missing.length > 0) throw new Error(`Missing tools: ${missing.join(', ')}`);
  console.log(`stdio smoke test passed (${names.length} tools)`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
