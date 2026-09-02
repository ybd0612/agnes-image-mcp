import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AppError } from '../errors.js';
import type { ValidateImageInput } from '../schemas/validate-image.js';

const signatures: Array<[string, number[], number[]]> = [['png', [0x89, 0x50, 0x4e, 0x47], [0, 1, 2, 3]], ['jpeg', [0xff, 0xd8, 0xff], [0, 1, 2]], ['gif', [0x47, 0x49, 0x46], [0, 1, 2]]];
function detect(buf: Uint8Array): string | undefined {
  const basic = signatures.find(([, sig, pos]) => buf.length >= Math.max(...pos) + 1 && sig.every((v, i) => buf[pos[i]] === v))?.[0];
  if (basic) return basic;
  return buf.length >= 12 && String.fromCharCode(...buf.slice(0, 4)) === 'RIFF' && String.fromCharCode(...buf.slice(8, 12)) === 'WEBP' ? 'webp' : undefined;
}

async function safeLocal(source: string): Promise<string> {
  if (source.includes('\0') || path.isAbsolute(source)) throw new AppError('PATH_NOT_ALLOWED', '仅允许工作目录下的相对路径');
  const root = path.resolve(process.cwd());
  const out = path.resolve(root, source);
  if (!out.startsWith(root + path.sep)) throw new AppError('PATH_NOT_ALLOWED', '路径越界');
  let current = root;
  for (const entry of path.relative(root, out).split(path.sep)) {
    current = path.join(current, entry);
    try {
      const stats = await fs.lstat(current);
      if (stats.isSymbolicLink()) throw new AppError('PATH_NOT_ALLOWED', '路径不允许包含链接');
      const canonical = await fs.realpath(current);
      if (process.platform === 'win32' ? canonical.toLowerCase() !== current.toLowerCase() : canonical !== current) throw new AppError('PATH_NOT_ALLOWED', '路径不允许包含链接');
    } catch (error) {
      if (error instanceof AppError) throw error;
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') break;
      throw new AppError('PATH_NOT_ALLOWED', '无法检查本地路径');
    }
  }
  return out;
}

export async function validateImage(input: ValidateImageInput) {
  let bytes: Uint8Array;
  const localPath = await safeLocal(input.path);
  try {
    const stats = await fs.lstat(localPath);
    if (stats.isSymbolicLink()) return invalid('本地文件不允许是链接');
    if (stats.size > input.maxBytes) return invalid('图片超过大小限制', stats.size);
    bytes = new Uint8Array(await fs.readFile(localPath));
  } catch (error) {
    if (error instanceof AppError) throw error;
    return invalid('无法读取本地文件');
  }
  if (bytes.byteLength > input.maxBytes) return invalid('图片超过大小限制');
  const format = detect(bytes);
  if (!format) return invalid('无法识别图片格式', bytes.byteLength);
  return { valid: true, format, width: null, height: null, bytes: bytes.byteLength, reason: null };
}
function invalid(reason: string, bytes = 0) { return { valid: false, format: null, width: null, height: null, bytes, reason }; }
