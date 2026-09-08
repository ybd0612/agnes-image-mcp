import { z } from 'zod';
import { ratioValues, sizeValues } from './generate-image.js';

const item = z.object({
  id: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).max(10000),
  model: z.string().min(1).optional().describe('实际模型名；省略时使用 AGNES_MODEL 或默认模型 agnes-image-2.5-flash；default 仅作为用户组兼容别名。'),
  size: z.enum(sizeValues).default('1K'),
  ratio: z.enum(ratioValues).default('1:1'),
  images: z.array(z.string().min(1)).max(8).optional(),
}).strict();

export const generateImagesSchema = z.object({
  items: z.array(item).min(1).max(10),
  continueOnError: z.boolean().default(false),
}).strict();
export type GenerateImagesInput = z.infer<typeof generateImagesSchema>;
