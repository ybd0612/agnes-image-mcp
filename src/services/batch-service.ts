import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { ImageService } from './image-service.js';
import type { GenerationData } from '../types/image.js';
import type { GenerateImagesInput } from '../schemas/generate-images.js';
import { downloadImage } from './download-service.js';
import { asAppError } from '../errors.js';

export interface BatchItem {
  index: number;
  id?: string;
  success: boolean;
  image?: GenerationData;
  file?: { path: string; bytes: number; mimeType: string; sha256: string; validated: true };
  error?: { code: string; message: string; stage: 'generation' | 'download' };
}

type Download = typeof downloadImage;

export async function generateBatch(service: ImageService, input: GenerateImagesInput, download: Download = downloadImage) {
  const results: BatchItem[] = [];
  for (let index = 0; index < input.items.length; index++) {
    const item = input.items[index];
    if (!item) continue;
    try {
      const image = await service.generate({ ...item, output: 'url' });
      if (!image.url) throw new Error('Agnes 未返回图片 URL');
      const file = await download({ url: image.url, outputPath: path.join('output', `agnes-${randomUUID()}.png`), maxBytes: 10 * 1024 * 1024 });
      results.push({ index, ...(item.id === undefined ? {} : { id: item.id }), success: true, image, file: { ...file, validated: true } });
    } catch (error) {
      const e = asAppError(error);
      const stage = e.code === 'IMAGE_DOWNLOAD_FAILED' || e.code === 'IMAGE_TOO_LARGE' || e.code === 'PATH_NOT_ALLOWED' || e.code === 'FILE_WRITE_FAILED' || e.code === 'INVALID_IMAGE' ? 'download' : 'generation';
      results.push({ index, ...(item.id === undefined ? {} : { id: item.id }), success: false, error: { code: e.code, message: e.message, stage } });
      if (!input.continueOnError) break;
    }
  }
  const succeededCount = results.filter(r => r.success).length;
  const failedCount = results.length - succeededCount;
  const skippedCount = input.items.length - results.length;
  const allSucceeded = succeededCount === input.items.length;
  return { code: allSucceeded ? 'OK' : 'OK_WITH_ERRORS', message: allSucceeded ? 'success' : '部分生成成功', data: { results, requestedCount: input.items.length, succeededCount, failedCount, skippedCount } };
}
