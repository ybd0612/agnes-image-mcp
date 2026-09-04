import { z } from 'zod';
export const ratioValues = ['1:1','3:4','4:3','16:9','9:16','2:3','3:2','21:9'] as const;
export const sizeValues = ['1K','2K','3K','4K'] as const;
export const generateImageSchema = z.object({ prompt: z.string().min(1).max(10000), model: z.string().min(1).optional(), size: z.enum(sizeValues).default('1K'), ratio: z.enum(ratioValues).default('1:1'), images: z.array(z.string().min(1)).max(8).optional() }).strict();
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
