import type { ImageService } from './image-service.js';
import type { GenerationData } from '../types/image.js';
import type { GenerateImagesInput } from '../schemas/generate-images.js';
export interface BatchItem { index: number; id: string; success: boolean; image?: GenerationData; error?: { code: string; message: string }; }
export async function generateBatch(service: ImageService, input: GenerateImagesInput) {
  const results: BatchItem[] = [];
  for (let index = 0; index < input.items.length; index++) {
    const item = input.items[index];
    try { const image = await service.generate(item); results.push({ index, id: item.id, success: true, image }); }
    catch (e: any) { results.push({ index, id: item.id, success: false, error: { code: e.code || 'UPSTREAM_BAD_RESPONSE', message: e.message || '生成失败' } }); if (!input.continueOnError) break; }
  }
  const succeededCount = results.filter(r => r.success).length;
  return { code: results.every(r => r.success) ? 'OK' : 'OK_WITH_ERRORS', message: results.every(r => r.success) ? 'success' : '部分生成成功', data: { results, requestedCount: input.items.length, succeededCount, failedCount: results.length - succeededCount } };
}
