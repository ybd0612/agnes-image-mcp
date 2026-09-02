import { z } from 'zod';
export const downloadImageSchema = z.object({ url: z.string().url().refine((value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } }, '仅允许 HTTPS URL'), outputPath: z.string().min(1).max(1000), maxBytes: z.number().int().positive().max(100 * 1024 * 1024).default(10 * 1024 * 1024) }).strict();
export type DownloadImageInput = z.infer<typeof downloadImageSchema>;
