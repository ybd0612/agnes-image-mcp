import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getConfig } from './config.js';
import { AppError, envelopeError } from './errors.js';
import { AgnesProvider } from './providers/agnes-provider.js';
import { ImageService } from './services/image-service.js';
import { generateBatch } from './services/batch-service.js';
import { downloadImage } from './services/download-service.js';
import { validateImage } from './services/validation-service.js';
import { generateImageSchema } from './schemas/generate-image.js';
import { generateImagesSchema } from './schemas/generate-images.js';
import { downloadImageSchema } from './schemas/download-image.js';
import { validateImageSchema } from './schemas/validate-image.js';
function result(value: unknown) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }] }; }
function failure(error: unknown) { return { ...result(envelopeError(error)), isError: true }; }
export function createServer() {
  const config = getConfig(); const service = new ImageService(new AgnesProvider(config)); const server = new McpServer({ name: 'agnes-image-mcp', version: '0.1.0' });
  server.tool('generate_image', '生成一张 Agnes 图片', generateImageSchema.shape, async (input) => { try { const data = await service.generate(input); return result({ code: 'OK', message: 'success', data }); } catch (e) { return failure(e); } });
  server.tool('generate_images', '批量生成 Agnes 图片', generateImagesSchema.shape, async (input) => { try { return result(await generateBatch(service, input)); } catch (e) { return failure(e); } });
  server.tool('download_image', '下载图片到安全的工作目录路径', downloadImageSchema.shape, async (input) => { try { return result({ code: 'OK', message: 'success', data: await downloadImage(input) }); } catch (e) { return failure(e); } });
  server.tool('validate_image', '校验图片格式和大小', validateImageSchema.shape, async (input) => { try { const data = await validateImage(input); return result({ code: data.valid ? 'OK' : 'VALIDATION_FAILED', message: data.valid ? 'valid image' : data.reason, data }); } catch (e) { return failure(e); } });
  return server;
}
