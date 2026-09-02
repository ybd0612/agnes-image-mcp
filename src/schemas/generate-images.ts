import { z } from 'zod';
import { ratioValues, sizeValues } from './generate-image.js';
const item = z.object({ id: z.string().min(1).max(100).optional(), prompt: z.string().min(1).max(10000), model: z.string().min(1).optional(), size: z.enum(sizeValues), ratio: z.enum(ratioValues).optional(), images: z.array(z.string().min(1)).max(8).optional(), output: z.enum(['url','base64']).default('url') }).strict();
export const generateImagesSchema = z.object({ items: z.array(item).min(1).max(10), continueOnError: z.boolean().default(false), concurrency: z.literal(1).default(1) }).strict();
export type GenerateImagesInput = z.infer<typeof generateImagesSchema>;
