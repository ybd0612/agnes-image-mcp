import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AppError } from '../errors.js';
import type { DownloadImageInput } from '../schemas/download-image.js';
const blockedNames = /^(?:windows|system32|program files|programdata|etc|usr|var|bin|sbin|root|boot|dev|proc|sys)$/i;
function safePath(target: string): string { if (target.includes('\0')) throw new AppError('PATH_NOT_ALLOWED', '目标路径不允许'); if (path.isAbsolute(target)) throw new AppError('PATH_NOT_ALLOWED', '仅允许工作目录下的相对路径'); const root = path.resolve(process.cwd()); const resolved = path.resolve(root, target); if (!resolved.startsWith(root + path.sep)) throw new AppError('PATH_NOT_ALLOWED', '目标路径越界'); if (resolved.split(path.sep).some(blockedNames.test.bind(blockedNames))) throw new AppError('PATH_NOT_ALLOWED', '目标路径不允许'); return resolved; }
function publicUrl(value: string): URL { let u: URL; try { u = new URL(value); } catch { throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片 URL 无效'); } if (u.protocol !== 'https:') throw new AppError('IMAGE_DOWNLOAD_FAILED', '仅允许 HTTPS 图片 URL'); if (u.username || u.password) throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片 URL 不允许凭据'); const host = u.hostname.toLowerCase(); if (host === 'localhost' || host === 'metadata.google.internal' || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片地址不允许访问内网'); return u; }
export async function downloadImage(input: DownloadImageInput, fetchImpl: typeof fetch = fetch) {
  const target = safePath(input.outputPath); try { await fs.access(target); throw new AppError('FILE_WRITE_FAILED', '目标文件已存在'); } catch (e) { if (e instanceof AppError) throw e; }
  let current = publicUrl(input.url); let response: Response | undefined;
  for (let i = 0; i <= 3; i++) { response = await fetchImpl(current, { redirect: 'manual' }); if (response.status >= 300 && response.status < 400) { const location = response.headers.get('location'); if (!location || i === 3) throw new AppError('IMAGE_DOWNLOAD_FAILED', '重定向次数超限'); current = publicUrl(new URL(location, current).toString()); continue; } break; }
  if (!response || !response.ok) throw new AppError('IMAGE_DOWNLOAD_FAILED', `下载失败（HTTP ${response?.status ?? 0}）`);
  const length = Number(response.headers.get('content-length') || 0); if (length > input.maxBytes) throw new AppError('IMAGE_TOO_LARGE', '图片超过大小限制'); const bytes = new Uint8Array(await response.arrayBuffer()); if (bytes.byteLength > input.maxBytes) throw new AppError('IMAGE_TOO_LARGE', '图片超过大小限制');
  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream'; if (!mimeType.startsWith('image/')) throw new AppError('INVALID_IMAGE', '响应不是图片'); await fs.mkdir(path.dirname(target), { recursive: true }); try { await fs.writeFile(target, bytes, { flag: 'wx' }); } catch { throw new AppError('FILE_WRITE_FAILED', '图片写入失败'); }
  return { path: path.relative(process.cwd(), target), bytes: bytes.byteLength, mimeType, sha256: createHash('sha256').update(bytes).digest('hex') };
}
