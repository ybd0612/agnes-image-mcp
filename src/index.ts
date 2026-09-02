#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

try {
  const server = createServer();
  const transport = new StdioServerTransport();
  let closing: Promise<void> | undefined;

  async function closeGracefully(): Promise<void> {
    if (!closing) {
      closing = server.close();
    }
    await closing;
  }

  const handleSignal = () => {
    void closeGracefully().catch((error) => {
      console.error(error instanceof Error ? error.message : '关闭失败');
      process.exitCode = 1;
    });
  };
  process.once('SIGINT', handleSignal);
  process.once('SIGTERM', handleSignal);

  await server.connect(transport);
} catch (error) {
  console.error(error instanceof Error ? error.message : '启动失败');
  process.exitCode = 1;
}
