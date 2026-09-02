import { AppError } from './errors.js';
export const DEFAULT_ENDPOINT = 'https://api.agnes-ai.cn/v1/images/generations';
export const DEFAULT_MODEL = 'agnes-image-2.5-flash';
export interface Config { apiKey: string; model: string; }
export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const apiKey = env.AGNES_API_KEY?.trim();
  if (!apiKey) throw new AppError('MISSING_API_KEY', '缺少 AGNES_API_KEY');
  return { apiKey, model: env.AGNES_MODEL?.trim() || DEFAULT_MODEL };
}
