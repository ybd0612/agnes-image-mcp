import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { promises as dns } from 'node:dns';
import net from 'node:net';
import path from 'node:path';
import { AppError } from '../errors.js';
import type { DownloadImageInput } from '../schemas/download-image.js';

const blockedNames = /^(?:windows|system32|program files|programdata|etc|usr|var|bin|sbin|root|boot|dev|proc|sys)$/i;
const DEFAULT_TIMEOUT_MS = 15000;
type Resolver = { lookup: (hostname: string, options: { all: true; verbatim: true }) => Promise<Array<{ address: string; family: number }>> };

function rejectPathEntry(stats: { isSymbolicLink(): boolean }, entry: string): void {
  if (stats.isSymbolicLink()) throw new AppError('PATH_NOT_ALLOWED', `目标路径包含链接：${entry}`);
}

async function safePath(target: string): Promise<string> {
  if (target.includes('\0')) throw new AppError('PATH_NOT_ALLOWED', '目标路径不允许');
  if (path.isAbsolute(target)) throw new AppError('PATH_NOT_ALLOWED', '仅允许工作目录下的相对路径');
  const root = path.resolve(process.cwd());
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(root + path.sep)) throw new AppError('PATH_NOT_ALLOWED', '目标路径越界');
  if (resolved.split(path.sep).some((entry) => blockedNames.test(entry))) throw new AppError('PATH_NOT_ALLOWED', '目标路径不允许');
  const relative = path.relative(root, resolved);
  let current = root;
  for (const entry of relative.split(path.sep)) {
    current = path.join(current, entry);
    try { rejectPathEntry(await fs.lstat(current), entry); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
      if (error instanceof AppError) throw error;
      throw new AppError('PATH_NOT_ALLOWED', '无法检查目标路径');
    }
  }
  return resolved;
}

function ipv4Blocked(value: string): boolean {
  const parts = value.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a >= 224);
}

function ipv6Blocked(value: string): boolean {
  const normalized = value.toLowerCase().split('%')[0];
  if (normalized.includes('.')) {
    const mapped = normalized.slice(normalized.lastIndexOf(':') + 1);
    if (net.isIP(mapped) === 4) return ipv4Blocked(mapped);
  }
  const groups = normalized.split('::');
  if (groups.length > 2) return true;
  const left = groups[0] ? groups[0].split(':').filter(Boolean) : [];
  const right = groups[1] ? groups[1].split(':').filter(Boolean) : [];
  const all = [...left, ...right].map((part) => Number.parseInt(part, 16));
  if (all.some((part) => !Number.isInteger(part) || part < 0 || part > 0xffff)) return true;
  const expanded = groups.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right].map((part) => Number.parseInt(part, 16)) : all;
  if (expanded.length !== 8) return true;
  const first = expanded[0];
  if (expanded.every((part) => part === 0) || expanded.slice(0, 7).every((part) => part === 0) && expanded[7] === 1 || (first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00 || (expanded[0] === 0x20 && expanded[1] === 0x01 && expanded[2] === 0x0db8)) return true;
  if (expanded[0] === 0 && expanded[1] === 0 && expanded[2] === 0 && expanded[3] === 0 && expanded[4] === 0 && expanded[5] === 0xffff) {
    const hi = expanded[6]; const lo = expanded[7];
    return ipv4Blocked(`${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`);
  }
  return false;
}

function blockedAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, '');
  const family = net.isIP(normalized);
  return family === 4 ? ipv4Blocked(address) : family === 6 ? ipv6Blocked(address) : true;
}

async function assertPublicUrl(value: string, resolver: Resolver): Promise<URL> {
  let url: URL;
  try { url = new URL(value); } catch { throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片 URL 无效'); }
  if (url.protocol !== 'https:') throw new AppError('IMAGE_DOWNLOAD_FAILED', '仅允许 HTTPS 图片 URL');
  if (url.username || url.password) throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片 URL 不允许凭据');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'metadata.google.internal' || (net.isIP(hostname) !== 0 && blockedAddress(hostname))) throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片地址不允许访问内网');
  try {
    const records = await resolver.lookup(url.hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => blockedAddress(record.address))) throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片地址不允许访问内网');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('IMAGE_DOWNLOAD_FAILED', '无法解析图片地址');
  }
  return url;
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const length = Number(response.headers.get('content-length') || 0);
  if (length > maxBytes) throw new AppError('IMAGE_TOO_LARGE', '图片超过大小限制');
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > maxBytes) throw new AppError('IMAGE_TOO_LARGE', '图片超过大小限制');
    return bytes;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new AppError('IMAGE_TOO_LARGE', '图片超过大小限制');
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

function detectFormat(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'webp';
  return undefined;
}

export async function downloadImage(input: DownloadImageInput, fetchImpl: typeof fetch = fetch, resolver: Resolver = { lookup: dns.lookup.bind(dns) }, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const target = await safePath(input.outputPath);
  try { await fs.access(target); throw new AppError('FILE_WRITE_FAILED', '目标文件已存在'); } catch (error) { if (error instanceof AppError) throw error; }
  let current = await assertPublicUrl(input.url, resolver);
  let response: Response | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let i = 0; i <= 3; i++) {
      response = await fetchImpl(current, { redirect: 'manual', signal: controller.signal });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location || i === 3) throw new AppError('IMAGE_DOWNLOAD_FAILED', '重定向次数超限');
        current = await assertPublicUrl(new URL(location, current).toString(), resolver);
        continue;
      }
      break;
    }
    if (!response || !response.ok) throw new AppError('IMAGE_DOWNLOAD_FAILED', `下载失败（HTTP ${response?.status ?? 0}）`);
    const bytes = await readLimited(response, input.maxBytes);
    const mimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    const format = detectFormat(bytes);
    const expectedMime = format === 'jpeg' ? 'image/jpeg' : format ? `image/${format}` : undefined;
    if (!mimeType || !expectedMime || mimeType !== expectedMime) throw new AppError('INVALID_IMAGE', '响应不是受支持的图片');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await safePath(input.outputPath);
    try { await fs.writeFile(target, bytes, { flag: 'wx' }); } catch { throw new AppError('FILE_WRITE_FAILED', '图片写入失败'); }
    return { path: path.relative(process.cwd(), target), bytes: bytes.byteLength, mimeType, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if ((error as Error)?.name === 'AbortError') throw new AppError('UPSTREAM_TIMEOUT', '图片下载超时');
    throw new AppError('IMAGE_DOWNLOAD_FAILED', '图片下载失败');
  } finally { clearTimeout(timer); }
}
