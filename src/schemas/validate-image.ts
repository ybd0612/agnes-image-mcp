import { z } from 'zod';
export const validateImageSchema = z.object({ path: z.string().min(1), maxBytes: z.number().int().positive().max(100 * 1024 * 1024).default(10 * 1024 * 1024) }).strict();
export type ValidateImageInput = z.infer<typeof validateImageSchema>;
