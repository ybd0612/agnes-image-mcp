import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConfig } from './config.js';
import { envelopeError } from './errors.js';
import { AgnesProvider } from './providers/agnes-provider.js';
import { ImageService } from './services/image-service.js';
import { generateBatch } from './services/batch-service.js';
import { generateImagesSchema } from './schemas/generate-images.js';
import packageJson from '../package.json' with { type: 'json' };

const envelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.union([z.record(z.string(), z.unknown()), z.null()]),
}).strict();

type StructuredEnvelope = { code: string; message: string; data: unknown };

function result(value: StructuredEnvelope) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value) }],
    structuredContent: value,
  };
}

function failure(error: unknown) {
  return { ...result(envelopeError(error)), isError: true };
}

export function createServer() {
  const config = getConfig();
  const service = new ImageService(new AgnesProvider(config));
  const server = new McpServer({ name: 'agnes-image-mcp', version: packageJson.version });

  server.registerTool('generate_images', {
    title: '生成图片并保存',
    description: '使用免费 Agnes default 用户组生成一张或多张图片。传入一个或多个 items；服务会按免费版 RPM 串行限流，自动下载并校验到当前工作目录。',
    inputSchema: generateImagesSchema,
    outputSchema: envelopeSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input) => {
    try {
      return result(await generateBatch(service, input));
    } catch (e) {
      return failure(e);
    }
  });

  return server;
}
