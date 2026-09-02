import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConfig } from './config.js';
import { envelopeError } from './errors.js';
import { AgnesProvider } from './providers/agnes-provider.js';
import { ImageService } from './services/image-service.js';
import { generateBatch } from './services/batch-service.js';
import { downloadImage } from './services/download-service.js';
import { validateImage } from './services/validation-service.js';
import { generateImageSchema } from './schemas/generate-image.js';
import { generateImagesSchema } from './schemas/generate-images.js';
import { downloadImageSchema } from './schemas/download-image.js';
import { validateImageSchema } from './schemas/validate-image.js';

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
  const server = new McpServer({ name: 'agnes-image-mcp', version: '0.1.0' });

  server.registerTool('generate_image', {
    title: '生成图片',
    description: '使用 Agnes 模型生成一张图片。支持文生图或参考图输入，可返回图片 URL 或 base64；会调用远程 Agnes API。',
    inputSchema: generateImageSchema,
    outputSchema: envelopeSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input) => {
    try {
      const data = await service.generate(input);
      return result({ code: 'OK', message: 'success', data });
    } catch (e) {
      return failure(e);
    }
  });

  server.registerTool('generate_images', {
    title: '批量生成图片',
    description: '按顺序批量调用 Agnes 生成图片，默认遇错停止；可选择继续处理并返回每项成功、失败和跳过统计。',
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

  server.registerTool('download_image', {
    title: '下载图片',
    description: '从经过安全校验的 HTTPS 公网地址下载图片到当前工作目录下的相对路径；拒绝内网地址、路径越界、链接和覆盖已有文件。',
    inputSchema: downloadImageSchema,
    outputSchema: envelopeSchema,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  }, async (input) => {
    try {
      return result({ code: 'OK', message: 'success', data: await downloadImage(input) });
    } catch (e) {
      return failure(e);
    }
  });

  server.registerTool('validate_image', {
    title: '校验本地图片',
    description: '读取当前工作目录下的相对路径，校验本地文件大小及 PNG、JPEG、GIF、WebP 格式，不访问网络也不修改文件。',
    inputSchema: validateImageSchema,
    outputSchema: envelopeSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (input) => {
    try {
      const data = await validateImage(input);
      return result({ code: data.valid ? 'OK' : 'INVALID_IMAGE', message: data.valid ? 'valid image' : (data.reason ?? 'invalid image'), data });
    } catch (e) {
      return failure(e);
    }
  });

  return server;
}
